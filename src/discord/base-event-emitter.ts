import EventTarget from "node:events";

export class BaseEventEmitter extends EventTarget {
	clientId: string;
	constructor(clientId: string) {
		super();
		console.log("Instantiated with", clientId);
		this.clientId = clientId;
	}
	emit(eventName: string | symbol, ...arguments_: any[]): boolean {
		console.log(eventName, ...arguments_);
		return super.emit(eventName, ...arguments_);
	}
}
