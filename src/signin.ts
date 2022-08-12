import { Color, Titlebar } from "custom-electron-titlebar";
import { ipcRenderer } from "electron";
import process from "node:process";

window.addEventListener("DOMContentLoaded", () => {
	if (process.platform === "win32") {
		new Titlebar({
			backgroundColor: Color.fromHex("#332228"),
			iconSize: 20,
			menu: undefined,
			titleHorizontalAlignment: "center",
		});
	}
	document.querySelector(".p-nav")?.remove();
	document.querySelector(".notices")?.remove();
	document.querySelector("#top > div.p-body-header")?.remove();
	document.querySelector(".listHeap").innerHTML = `
    <div class="block-outer-middle">
					<a href="javascript:signin();">เบราว์เซอร์</a>
				</div>
    `;
	document.querySelector("#footer")?.remove();
	const script = document.createElement("script");
	script.type = "text/javascript";
	script.innerHTML = `
	const shell = require('electron').shell;
    function signin() {
        shell.openExternal("https://forum.hareshi.net/login/?desktop");
    }`;
	document.querySelectorAll("head")[0].append(script);
});

ipcRenderer.send("signin");
