/* eslint-disable unicorn/consistent-function-scoping */
import { ipcRenderer, IpcRendererEvent } from "electron";
import options from "../types/loader";

window.addEventListener("DOMContentLoaded", () => {
	const loaderLine = document.querySelector<HTMLElement>("#loader-line"),
		sleepTime = 100;
	let initialLoad = true;

	ipcRenderer.send("asynchronous-message", 1);
	ipcRenderer.on("loader", (evnet: IpcRendererEvent, argument: options) => {
		document.querySelector("#title").textContent = argument.title || argument.run;
		// eslint-disable-next-line @typescript-eslint/ban-types
		const Function: { [K: string]: Function } = {
			complete: complete,
			dec: dec,
			error: error,
			inc: inc,
			init: init,
			load: load,
			reset: reset,
		};

		call(argument.run);
		function call(name: string) {
			if (Function[name]) {
				return Function[name]();
			}
			throw new Error(`Method '${name}' is not implemented.`);
		}

		async function init() {
			load();
			await sleep(2000);
		}

		async function inc() {
			if (loaderLine.classList.contains("load")) {
				return loaderLine.classList.remove("load");
			}
			const currentProgress = loaderLine.style.strokeDasharray;
			if (Number(currentProgress) === 0) {
				return (loaderLine.style.strokeDasharray = "400");
			} else if (Number(argument.amount) > 400) {
				return (loaderLine.style.strokeDasharray = argument.amount);
			}
		}

		function dec() {
			initialLoad = false;
			if (loaderLine.classList.contains("load")) {
				return loaderLine.classList.remove("load");
			}
			const currentProgress = loaderLine.style.strokeDasharray;
			if (Number(currentProgress) > 400) {
				loaderLine.style.strokeDasharray = `${Number(currentProgress) - 66}`;
			}
		}

		function load() {
			loaderLine.style.strokeDasharray = "400";
			if (loaderLine.classList.contains("load")) {
				return loaderLine.classList.remove("load");
			}
			loaderLine.classList.add("load");
		}

		async function reset() {
			initialLoad = false;
			if (loaderLine.classList.contains("load")) {
				loaderLine.classList.remove("load");
			}
			await sleep(sleepTime);
			loaderLine.style.strokeDasharray = "400";
		}

		async function complete() {
			initialLoad = false;
			if (loaderLine.classList.contains("load")) {
				loaderLine.classList.remove("load");
			}
			await sleep(sleepTime);
			loaderLine.style.strokeDasharray = "790";
		}

		async function error() {
			initialLoad = false;
			document.querySelector("#loader-line").setAttribute("style", "--loader:red");
			if (loaderLine.classList.contains("load")) {
				loaderLine.classList.remove("load");
			}
			await sleep(10);
			loaderLine.style.strokeDasharray = "790";
		}

		function sleep(time: number) {
			return new Promise<void>((response, rej) => {
				setTimeout(() => response(), time);
			});
		}
	});
});
