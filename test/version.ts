import { notice, setFailed } from "@actions/core";
import { run } from "npm-check-updates";
import { clean } from "semver";
import { name, version } from "../package.json";

const url_releases = `https://github.com/${name}/desktop/releases/download/v${version}/Hareshi-${version}.Setup.exe`,
	pkg = clean(version),
	url_ver = clean(url_releases.split("download/v")[1]?.split("/")[0]);

try {
	(async () => {
		await run({
			packageFile: "./package.json",
			upgrade: false,
		}).then((x) => {
			notice(`NPM Check Updates:\n ${JSON.stringify(x)}`);
		});
		if (pkg !== url_ver) setFailed(`Version not match Package:${pkg} Releases url:${url_ver}`);
		else notice(`Version is match Package:${pkg} Releases url:${url_ver}`);
	})();
} catch (error) {
	setFailed(`Action failed with error ${error}`);
}
