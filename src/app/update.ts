import axios, { AxiosRequestConfig } from "axios";
import chokidar from "chokidar";
import { app, autoUpdater, BrowserWindow, ipcMain, IpcMainEvent, MessageBoxReturnValue } from "electron";
import electronDev from "electron-is-dev";
import { error, info } from "electron-log";
import { join, resolve } from "node:path";
import process from "node:process";
import { format } from "node:util";
import open from "open";
import { clean, diff } from "semver";
import option from "../types/loader";
import { dialogs } from "./dialog";

const update_platform = new Set(["win32", "darwin", "linux"]);
autoUpdater.setFeedURL({
	headers: { "User-Agent": format("%s/%s (% s: %s)", "hareshi", app.getVersion(), process.platform, process.arch) },
	url: `https://update.electronjs.org/Hareshi/hareshi-desktop/${process.platform}-${process.arch}/${app.getVersion()}`,
});

export default class AppUpdate {
	static #interval: number | NodeJS.Timer;
	static silent = false;
	static running = true;
	static isInitialized = false;
	static startup() {
		const loader = BrowserWindow.fromId(1),
			mainWindow = BrowserWindow.fromId(2);

		ipcMain.once("asynchronous-message", async (event: IpcMainEvent) => {
			event.sender.send("loader", { run: "init", title: `Checking for update` } as option);
			const updateServer = await axios({
					method: "get",
					responseType: "json",
					url: autoUpdater.getFeedURL(),
				} as AxiosRequestConfig),
				version = clean(updateServer.data?.name || "0.0.0"),
				versionDiff = diff(version, app.getVersion());
			let watcher: chokidar.FSWatcher;
			// eslint-disable-next-line unicorn/no-nested-ternary
			electronDev || false ? (updateServer.status = 204) : !update_platform.has(process.platform) ? (updateServer.status = 204) : undefined;
			switch (updateServer.status) {
				case 200:
					autoUpdater.once("update-available", () => {
						event.sender.send("loader", { run: "load", title: `${versionDiff} Update available` } as option);
					});
					autoUpdater.once("update-downloaded", async () => {
						await watcher.close();
						event.sender.send("loader", { run: "complete", title: "Completed.." } as option);
						setTimeout(() => {
							autoUpdater.quitAndInstall(), app.exit();
						}, 500);
					});
					autoUpdater.once("error", (message: Error) => {
						error(`Updater ${message}`);
						event.sender.send("loader", { run: "error", title: `Update error ${message.name || ""}` } as option);
						dialogs.update("error", message.stack).then((value: MessageBoxReturnValue) => {
							if (value.response === 0) open("https://discord.gg/XpP3wDGaWX");
						});
					});
					if (process.platform === "win32") {
						return (async () => {
							const appFolder = resolve(process.execPath, "..");
							try {
								watcher = await chokidar.watch(join(appFolder, ".."), {
									ignorePermissionErrors: true,
									ignored: /(^|[/\\])resources/,
									persistent: true,
								});
								watcher.on("all", (eventName: "add" | "addDir" | "change" | "unlink" | "unlinkDir", path: string, stats) => {
									if (eventName && path) {
										event.sender.send("loader", {
											run: eventName === "change" ? "load" : "complete",
											title: `Patch ${eventName} ${path.split(app.name)[1]?.replace(`app-${version}`, "")?.replaceAll("\\", " ")}`,
										} as option);
									}
								});
								autoUpdater.checkForUpdates();
							} catch (error) {
								error(`StartCheckUpdates [${updateServer?.status}] :${error}`);
								event.sender.send("loader", { run: "error", title: `Update error: ${updateServer?.status || ""}` } as option);
							}
						})();
					} else if (["darwin", "linux"].includes(process.platform)) {
						try {
							autoUpdater.checkForUpdates();
						} catch {
							error(`StartCheckUpdates [${updateServer?.status}] :${error}`);
							event.sender.send("loader", { run: "error", title: `Update error: ${updateServer?.status || ""}` } as option);
						}
					}
					break;
				case 204:
					electronDev
						? event.sender.send("loader", { run: "complete", title: "Run is development (Skip check update)" } as option)
						: // eslint-disable-next-line unicorn/no-nested-ternary
						update_platform.has(process.platform)
						? event.sender.send("loader", { run: "complete", title: "Loading..." } as option)
						: event.sender.send("loader", { run: "complete", title: "Update not supported this platform :(" });
					mainWindow.once("ready-to-show", () => {
						event.sender.send("loader", { run: "complete", title: "> <" } as option);
						setTimeout(() => {
							switch (process.argv[1]) {
								case "--Hidden":
									if (loader.isFocused() && loader.isVisible()) {
										mainWindow.show();
									} else if (!mainWindow.isMinimized()) {
										mainWindow.minimize();
									}
									break;
								default:
									mainWindow.show();
									app.on("second-instance", (event, commandLine, workingDirectory) => {
										if (mainWindow) {
											if (mainWindow.isMinimized()) mainWindow.restore();
											mainWindow.focus();
										}
									});
									break;
							}
							loader.destroy();
							this.initialized();
						}, 750);
					});
					break;
				default: // 400
					error(`StartCheckUpdates : ${updateServer.status}`);
					return event.sender.send("loader", { run: "error", title: `Update error: ${updateServer.status}` } as option);
			}
		});
	}

	static initialized() {
		if (this.isInitialized) return;
		this.isInitialized = true;
		this.running = false;
		this.auto(true);
		info("AppUpdate :initialized");

		autoUpdater.on("checking-for-update", () => {
			this.auto(false);
			this.running = true;
			info("AppUpdate :checking for update");
		});

		autoUpdater.on("update-available", () => {
			info("AppUpdate :update available");
		});

		autoUpdater.on("update-not-available", () => {
			info("AppUpdate :update not available");
			if (!this.silent) {
				dialogs.update("not_available").then((value: MessageBoxReturnValue) => {
					if (value.response === 0) {
						this.auto(true);
						this.running = false;
					}
				});
			} else {
				this.auto(true);
				this.running = false;
			}
		});

		autoUpdater.on("update-downloaded", () => {
			info("AppUpdate :update downloaded");
			if (!this.silent) {
				dialogs.update("downloaded").then((value: MessageBoxReturnValue) => {
					if (value.response === 0) {
						autoUpdater.quitAndInstall();
						app.exit();
					}
				});
			} else {
				autoUpdater.quitAndInstall();
			}
		});

		autoUpdater.on("error", (message: Error) => {
			error(`AppUpdate ${message}`);
			if (!this.silent) {
				dialogs.update("error", message.stack).then((value: MessageBoxReturnValue) => {
					if (value.response === 0) open("https://discord.gg/XpP3wDGaWX");
					this.auto(false), (this.running = false);
				});
			} else {
				this.auto(false);
				this.running = false;
			}
		});
	}

	static async check() {
		if (!this.running) {
			this.auto(false), (this.silent = false);
			autoUpdater.checkForUpdates();
		}
	}

	static auto(enable: boolean, time?: number) {
		if (enable) {
			this.#interval = setInterval(() => {
				this.silent = true;
				autoUpdater.checkForUpdates();
			}, time || 20 * 60 * 1000);
		} else {
			if (this.#interval) clearInterval(this.#interval);
		}
	}
}
