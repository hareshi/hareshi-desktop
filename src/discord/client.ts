import { Activity, ResponseActivity } from "../types/presence";
import { SocketManager } from "./socket-manager.ts";

export declare interface Presence {
	on(event: "packet", listener: (opcode: number, data: string) => void): this;
	on(event: "conneting", listener: () => void): this;
	on(event: "connected", listener: () => void): this;
	on(event: "disconnected", listener: () => void): this;
	on(event: "activityUpdate", listener: (activity: ResponseActivity) => void): this;
	on(eventName: string | symbol, listener: (...arguments_: any[]) => void): this;
}

export class Presence extends SocketManager {
	currentPresence: Activity | undefined = undefined;
	queuedPresence = false;
	cooldown = false;

	async setActivity(presence: Activity | undefined): Promise<void> {
		if (this.cooldown) {
			this.currentPresence = presence;
			this.queuedPresence = true;
			return;
		}
		this.cooldown = true;
		try {
			if (presence && this.status != "connected") await this.connect();
			if (presence && this.status != "connected") throw new Error("Status did not become connected.");
			if (this.status == "connected") {
				const payload: { activity?: object; pid: number } = { pid: process.pid };
				if (presence) {
					presence.details = presence.details?.slice(0, 128);
					presence.state = presence.state?.slice(0, 128);
					if (presence.timestamps) {
						if (presence.timestamps.end instanceof Date) presence.timestamps.end = (presence.timestamps.end as Date).getTime();
						if (presence.timestamps.start instanceof Date) presence.timestamps.start = (presence.timestamps.start as Date).getTime();
					}
					payload.activity = presence;
				}
				this.request("SET_ACTIVITY", payload);
			}
		} catch (error) {
			console.warn("Presence couldn't set activity. Trying again in a few.", error);
			setTimeout(() => {
				this.cooldown = false;
				this.scheduledReconnect = true;
				this.setActivity(presence);
			}, 3000);
		}
		this.cooldown = false;
		if (this.queuedPresence) {
			this.queuedPresence = false;
			this.setActivity(this.currentPresence);
		}
	}
}
