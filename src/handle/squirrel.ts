import { app } from "electron";
import * as ChildProcess from "node:child_process";
import { basename, join, resolve } from "node:path";
import { platform } from "node:process";
import { Logger } from "tslog";

new Logger({
	dateTimePattern: "day-month-year hour:minute:second",
	dateTimeTimezone: "Asia/Bangkok",
	displayFilePath: !app.isPackaged ? "displayAll" : "hidden",
	displayFunctionName: !app.isPackaged,
	displayLoggerName: false,
	overwriteConsole: true,
	setCallerAsLoggerName: true,
});

(() => {
	if (!app.requestSingleInstanceLock()) return app.exit(0);
	// if (process.argv.length === 1) return false;
	const appFolder = resolve(process.execPath, ".."),
		rootAtomFolder = resolve(appFolder, ".."),
		updateDotExe = resolve(join(rootAtomFolder, "Update.exe")),
		exeName = basename(process.execPath),
		spawn = function (command: string, argument: ReadonlyArray<string>) {
			let spawnedProcess;
			try {
				spawnedProcess = ChildProcess.spawn(command, argument, { detached: true });
			} catch (error) {
				console.error(error);
			}
			return spawnedProcess;
		},
		spawnUpdate = function (argument: string[]) {
			return spawn(updateDotExe, argument);
		},
		squirrelEvent = process.argv[1];

	switch (squirrelEvent) {
		case "--squirrel-install":
			spawnUpdate(["--createShortcut", exeName]);
			if (app.isPackaged && ["win32", "darwin"].includes(platform)) {
				app.setLoginItemSettings({
					args: ["--Hidden"],
					name: app.name,
					openAsHidden: true,
					openAtLogin: true,
					path: platform === "win32" ? join(rootAtomFolder, `${app.name.toLocaleLowerCase()}.exe`) : process.execPath,
				});
			}
			return app.quit();
		case "--squirrel-updated":
			spawnUpdate(["--createShortcut", exeName]);
			return app.quit();
		case "--squirrel-uninstall":
			if (app.isPackaged && ["win32", "darwin"].includes(platform)) {
				app.setLoginItemSettings({
					enabled: false,
					name: app.name,
				});
			}
			spawnUpdate(["--removeShortcut", exeName]);
			return app.quit();
		case "--squirrel-obsolete":
			return app.quit();
		default:
			return import("../index");
	}
})();
