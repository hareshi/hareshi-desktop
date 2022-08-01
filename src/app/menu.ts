import { app, BrowserWindow, Menu } from "electron";
import electronDev from "electron-is-dev";

Menu.setApplicationMenu(
	Menu.buildFromTemplate([
		{
			label: app.name,
			submenu: [
				{ role: "about" },
				{ type: "separator" },
				{ role: electronDev ? "toggleDevTools" : undefined },
				{ role: electronDev ? "reload" : undefined },
				{ type: "separator" },
				{ role: "quit" },
			],
		},
		{
			click: () => {
				BrowserWindow?.fromId(1).webContents.goBack();
			},
			label: "Back",
		},
	]),
);
