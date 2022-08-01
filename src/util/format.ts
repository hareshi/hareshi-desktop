export default class Format {
	static bytes(bytes: number, text?: boolean) {
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
		if (bytes == 0) return "0 Byte";
		const index = Number(Math.floor(Math.log(bytes) / Math.log(1024)));
		return text ? Math.round(bytes / Math.pow(1024, index)) + " " + sizes[index] : Number(Math.round(bytes / Math.pow(1024, index)));
	}
}
