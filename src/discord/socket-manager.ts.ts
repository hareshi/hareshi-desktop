import { join } from "node:path";
import { Activity, DiscordEnvironment, IPCOpcode } from "../types/presence";
import { BaseEventEmitter } from "./base-event-emitter";
import { createConnection, DiscordSocket } from "./discord-socket";

export class SocketManager extends BaseEventEmitter {
	socket: DiscordSocket;
	status: "connected" | "disconnected" | "errored" | "connecting" = "disconnected";
	path = join(process.platform == "win32" ? "\\\\?\\pipe\\" : process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || process.env.TEMP || "/tmp", "discord-ipc-");
	currentPresence: Activity | undefined = undefined;
	scheduledReconnect = false;
	waiting: Map<string, (data: any) => void> = new Map();
	environment?: DiscordEnvironment;
	constructor(clientId: string) {
		super(clientId);
		this.on("disconnect", () => {
			if (this.currentPresence && !this.scheduledReconnect && (this.status == "errored" || this.status == "disconnected")) {
				this.scheduledReconnect = true;
				setTimeout((() => this.connect()).bind(this), 5000);
			}
		});
		this.connect().catch((error: Error) => {
			console.log(error);
		});
	}

	async connect(): Promise<DiscordSocket> {
		console.log("Starting connect");
		this.scheduledReconnect = false;
		if (this.status == "connected") return this.socket;
		this.status = "connecting";
		try {
			this.emit("connecting");
		} catch {
			undefined;
		}
		for (let attempt = 0; attempt < 10; attempt++) {
			console.log("Connection attempt #" + attempt);
			try {
				this.socket = await this.establishConnection(this.path + attempt);
				console.log("Connection success!");
				this.status = "connected";
				try {
					this.emit("connected");
				} catch (error) {
					console.error(error);
				}
				return this.socket;
			} catch (error) {
				console.log("Connection failed", error);
			}
		}
		this.status = "errored";
		try {
			this.emit("disconnected");
		} catch (error) {
			console.error(error);
		}
		throw new Error("Could not connect to IPC");
	}

	createSocket(path: string): Promise<DiscordSocket> {
		return new Promise((resolve, reject) => {
			try {
				console.log("Attempting to connect to", path);
				const socket = createConnection(path, () => {
					console.log("Connected to", path);
					this.removeListener("error", reject);
					resolve(socket);
				});
				socket.on("error", reject);
			} catch (error) {
				console.log("Failed to connect to", path, error);
				reject(error);
			}
		});
	}

	establishConnection(path: string): Promise<DiscordSocket> {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try {
				this.socket = await this.createSocket(path);
				console.log("Writing handshake");
				this.socket.writePacket(IPCOpcode.HANDSHAKE, { client_id: this.clientId, v: 1 });
				let first = true;
				this.socket.once("decodedPacket", (opcode, data) => {
					console.log("First packet", opcode);
					first = false;
					if (opcode == IPCOpcode.FRAME) {
						this.environment = JSON.parse(data).data;
						resolve(this.socket);
					} else {
						reject(new Error(data));
					}
				});
				this.socket.on("decodedPacket", (opcode, data) => {
					this.emit("packet", opcode, data);
					const index = JSON.parse(data);
					console.log("Got frame", index);
					if (index.cmd == "SET_ACTIVITY") {
						try {
							this.emit("activityUpdate", index.data);
						} catch (error) {
							console.error(error);
						}
					}
					try {
						this.emit(index.cmd, index);
					} catch (error) {
						console.error(error);
					}
					if (index.nonce && this.waiting.has(index.nonce)) {
						this.waiting.get(index.nonce)(data);
						this.waiting.delete(index.nonce);
					}
				});

				this.socket.on("close", () => {
					if (first) reject(new Error("Connection closed."));
					this.disconnect();
				});
			} catch (error) {
				console.log("Error establishing connection to", path, error);
				reject(error);
			}
		});
	}

	disconnect(): void {
		if (this.socket) this.socket.destroy();
		try {
			this.emit("disconnected");
		} catch (error) {
			console.error(error);
		}
		this.socket = undefined;
		this.status = "disconnected";
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
	request(cmd: string, arguments_?: any, event_?: string): Promise<any> {
		let uuid = "";
		for (let index = 0; index < 32; index += 1) {
			if (index === 8 || index === 12 || index === 16 || index === 20) {
				uuid += "-";
			}
			let n;
			if (index === 12) {
				n = 4;
			} else {
				const random = Math.trunc(Math.random() * 16);
				n = index === 16 ? Math.trunc(random & 3) : random;
			}
			uuid += n.toString(16);
		}
		return new Promise((a, r) => {
			if (!this.socket.writePacket(IPCOpcode.FRAME, { args: arguments_, cmd, evt: event_, nonce: uuid })) return r(new Error("Couldn't write."));
			this.waiting.set(uuid, (data) => a(data.data));
		});
	}
}
