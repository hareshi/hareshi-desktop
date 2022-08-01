import { notice, setFailed } from "@actions/core";
import path from "node:path";
import asar from "asar";

(() => {
	asar.createPackage(path.resolve(__dirname, "..", ".webpack"), path.join(path.resolve(__dirname, "..", "dist"), "app.asar"))
		.then(() => {
			notice("Created asar done.");
		})
		.catch((error) => {
			setFailed(`Created asar error ${error}`);
		});
})();
