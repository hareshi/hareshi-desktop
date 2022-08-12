import { app, BrowserWindow, Event, NewWindowWebContentsEvent, session } from "electron";
import { join } from "node:path";
// @ts-ignore
import { attachTitlebarToWindow, setupTitlebar } from "custom-electron-titlebar/main";
import electronDev from "electron-is-dev";
import process from "node:process";
import DiscordPresence from "../discord/presence";
import initTray from "./tray";
import AppUpdate from "./update";
import { Deeplink } from "electron-deeplink";
import("./menu");

if (process.platform === "win32") {
	setupTitlebar();
}

const protocol = electronDev ? "dev-hareshi" : "hareshi";

export default function browser() {
	let mainWindow: BrowserWindow, loading: BrowserWindow, sign_in: BrowserWindow;

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
		},
		createSignIn = (): void => {
			sign_in = new BrowserWindow({
				autoHideMenuBar: process.platform === "win32",
				height: 480,
				icon: join(__dirname, "..", "icons/png/512x512.png"),
				show: false,
				title: "Login",
				titleBarStyle: "hidden",
				webPreferences: {
					contextIsolation: false,
					devTools: electronDev,
					nodeIntegration: true,
					preload: SIGNIN_PRELOAD_WEBPACK_ENTRY,
				},
				width: 910,
			});
			attachTitlebarToWindow(mainWindow);
			sign_in.loadURL("https://forum.hareshi.net/login/");
		};

	app.once("ready", () => {
		if (!app.requestSingleInstanceLock()) {
			return app.exit(0);
		} else {
			createLoading();
			createWindow();
			createSignIn();
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
			sign_in.once("ready-to-show", () => {
				const deeplink = new Deeplink({ app, isDev: electronDev, mainWindow: sign_in, protocol });
				deeplink.on("received", (link) => {
					sign_in.loadURL(link?.replace(protocol, "https"));
				});
			});
			initTray();
			AppUpdate.startup();
			DiscordPresence.connecting(!electronDev);
			sign_in.on("close", function (event: Event) {
				event.preventDefault();
				sign_in.hide();
			});
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
