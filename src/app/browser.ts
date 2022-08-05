import { app, BrowserWindow, Event, NewWindowWebContentsEvent } from "electron";
import { join } from "node:path";
// @ts-ignore
import { attachTitlebarToWindow, setupTitlebar } from "custom-electron-titlebar/main";
import electronDev from "electron-is-dev";
import process from "node:process";
import DiscordPresence from "../discord/presence";
import initTray from "./tray";
import AppUpdate from "./update";
import("./menu");

if (process.platform === "win32") {
	setupTitlebar();
}

export default function browser() {
	let mainWindow: BrowserWindow, loading: BrowserWindow;

	const createWindow = (): void => {
			mainWindow = new BrowserWindow({
				autoHideMenuBar: process.platform === "win32",
				height: 760,
				icon: join(__dirname, "..", "icons/png/512x512.png"),
				show: false,
				titleBarStyle: "hidden",
				webPreferences: {
					contextIsolation: true,
					devTools: electronDev,
					nodeIntegration: true,
					preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
					webSecurity: true,
					webgl: true,
				},
				width: 1400,
			});
			attachTitlebarToWindow(mainWindow);
			mainWindow.loadURL("https://forum.hareshi.net");
			electronDev ? mainWindow.webContents.openDevTools({ mode: "undocked" }) : undefined;
			mainWindow.webContents.addListener("new-window", (event: NewWindowWebContentsEvent, url: string) => {
				event.preventDefault();
				mainWindow.loadURL(url);
			});
		},
		createLoading = (): void => {
			loading = new BrowserWindow({
				autoHideMenuBar: true,
				frame: false,
				height: 150,
				resizable: false,
				show: false,
				titleBarStyle: "hidden",
				webPreferences: {
					devTools: false,
					nodeIntegration: false,
					nodeIntegrationInWorker: false,
					preload: LOADING_PRELOAD_WEBPACK_ENTRY,
				},
				width: 500,
			});
			loading.loadURL(LOADING_WEBPACK_ENTRY);
		};

	app.once("ready", () => {
		if (!app.requestSingleInstanceLock()) {
			return app.exit(0);
		} else {
			createLoading();
			createWindow();
			loading.once("ready-to-show", () => {
				switch (process.argv[1]) {
					case "--Hidden":
						loading.minimize();
						break;
					default:
						loading.show();
						loading.focus();
						break;
				}
			});
			initTray();
			AppUpdate.startup();
			DiscordPresence.connecting(!electronDev);
			mainWindow.on("close", function (event: Event) {
				event.preventDefault();
				mainWindow.hide();
			});
		}
	});

	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") {
			app.quit();
		}
	});
}
