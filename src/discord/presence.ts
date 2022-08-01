import { app, BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import { Activity } from "../types/presence";
import { Presence } from "./client";

interface presence {
	currentURL: string;
	data: Activity | null;
}

export default class DiscordPresence {
	static #client = new Presence("944271713997324339");
	static #interval: number | NodeJS.Timer;
	static presence: presence;

	static connecting(startActivity?: boolean) {
		this.#client.on("connected", () => {
			console.log("Logged in as", this.#client.environment.user.username);
		});
		startActivity ? this.startActivity() : undefined;
	}

	static startActivity() {
		if (this.#interval) clearInterval(this.#interval);
		ipcMain.on("presence", (event: IpcMainEvent, argv) => {
			this.presence = argv;
		});

		this.#interval = setInterval(() => {
			const browserWindow = BrowserWindow.getAllWindows()[0]; // eslint-disable-next-line unicorn/no-useless-undefined
			if (!browserWindow.isVisible() || browserWindow.isMinimized()) return this.#client.setActivity(undefined);
			this.#client.setActivity({
				...this.presence?.data,
				assets: {
					...this.presence?.data?.assets,
					large_image: "hareshi",
					large_text: `${app.name} v${app.getVersion()}`,
				},
			});
		}, 2500);
	}
}
