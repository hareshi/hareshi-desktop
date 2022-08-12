import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import { join } from "node:path";
import AppUpdate from "./update";

export default function initTray() {
	app.whenReady().then(() => {
		const tray = new Tray(nativeImage.createFromPath(join(__dirname, "..", "..", "icons/png/icon.png")));
		tray.setContextMenu(
			Menu.buildFromTemplate([
				{
					click: () => {
						BrowserWindow?.fromId(1)?.show ?? BrowserWindow?.fromId(2)?.show();
					},
					label: `Launch ${app.name}`,
					type: "normal",
				},
				{
					click: () => AppUpdate.check(),
					label: `Check for updates`,
					type: "normal",
				},
				{ type: "separator" },
				{ click: () => app.exit(0), label: "Exit", type: "normal" },
			]),
		);
		tray.setToolTip(app.name);
		tray.setTitle(app.name);
		tray.on("click", () => {
			const mainWindow = BrowserWindow?.fromId(1) ?? BrowserWindow?.fromId(3) ?? BrowserWindow.fromId(2);
			if (!mainWindow.isVisible() || false) {
				mainWindow.show();
			} else if (mainWindow.isMinimized() || false) {
				mainWindow.focus();
			} else {
				mainWindow.minimize();
			}
		});
	});
}
