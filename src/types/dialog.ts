import { MessageBoxOptions } from "electron";

export interface Update {
	detail?: MessageBoxOptions["detail"];
	event: "not_available" | "downloaded" | "error";
}
