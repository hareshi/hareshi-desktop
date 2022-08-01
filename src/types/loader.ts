export default interface option {
	amount?: string;
	run: "complete" | "dec" | "error" | "inc" | "init" | "load" | "reset";
	title?: string;
}
