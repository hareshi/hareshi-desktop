import { createConnection as netCreateConnection, Socket } from "node:net";
import { IPCOpcode } from "../types/presence";

export interface DiscordSocket extends Socket {
	on(event: string, listener: (...arguments_: any[]) => void): this;
	on(event: "close", listener: (hadError: boolean) => void): this;
	on(event: "connect", listener: () => void): this;
	on(event: "data", listener: (data: Buffer) => void): this;
	on(event: "drain", listener: () => void): this;
	on(event: "end", listener: () => void): this;
	on(event: "error", listener: (error: Error) => void): this;
	on(event: "lookup", listener: (error: Error, address: string, family: string | number, host: string) => void): this;
	on(event: "ready", listener: () => void): this;
	on(event: "timeout", listener: () => void): this;
	read(argument0: number): Buffer;
	// eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
	on(event: "decodedPacket", listener: (opcode: number, data: string) => void): this;
	writePacket(opcode: IPCOpcode, data: any): boolean;
}

export function createConnection(path: string, connectionListener?: () => void): DiscordSocket {
	const socket = netCreateConnection(path, connectionListener) as DiscordSocket;
	// eslint-disable-next-line @typescript-eslint/ban-types
	socket.writePacket = (opcode: IPCOpcode, data: string | object) => {
		data = JSON.stringify(data);
		const dlen = Buffer.byteLength(data);
		const buffer = Buffer.alloc(dlen + 8);
		buffer.writeUInt32LE(opcode, 0);
		buffer.writeUInt32LE(dlen, 4);
		buffer.write(data, 8);
		return socket.write(buffer);
	};

	let opcode = -1;
	let remaining = 0;
	let data = "";
	socket.on("readable", () => {
		if (!socket.readableLength) return;
		console.log(socket.readableLength, "bytes available");

		if (opcode < 0) {
			const header = socket.read(8) as Buffer;
			opcode = header.readInt32LE(0);
			remaining = header.readInt32LE(4);
			console.log("Got header", { opcode, remaining });
			const body = socket.read(remaining) as Buffer;
			remaining -= body.length;
			console.log("Remaining bytes", remaining);
			data += body.toString();
		} else {
			const body = socket.read(remaining) as Buffer;
			remaining -= body.length;
			console.log("Remaining bytes", remaining);
			data += body.toString();
		}

		if (remaining <= 0) {
			console.log("Data complete!", opcode, data);
			socket.emit("decodedPacket", opcode, data);
			opcode = -1;
			data = "";
		}
	});
	return socket;
}
