import { dialog, MessageBoxOptions, MessageBoxReturnValue } from "electron";
import { Update } from "../types/dialog";

const box = {
	update: {
		downloaded: {
			buttons: ["Restart", "Later"],
			detail: "A new version has been downloaded. Restart the application to apply the updates.",
			noLink: true,
			title: "Update",
			type: "info",
		},
		error: {
			buttons: ["Report", "Ok"],
			noLink: true,
			title: "Update Error",
			type: "error",
		},
		not_available: {
			buttons: ["Ok"],
			detail: "A new version not available",
			title: "Update",
			type: "info",
		},
	},
};

export const dialogs = {
	update(event: Update["event"], detail?: MessageBoxOptions["detail"]) {
		return new Promise((resolve) => {
			dialog
				.showMessageBox({
					detail,
					...box.update[event],
				} as MessageBoxOptions)
				.then((value: MessageBoxReturnValue) => {
					resolve(value);
				});
		});
	},
};
