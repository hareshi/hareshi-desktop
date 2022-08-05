// Document https://electron.github.io/electron-packager/main/modules/electronpackager.html
const path = require("node:path"),
	ignore = (file) => {
		if (!file) return false;
		if (file.endsWith(path.join(".webpack", "main", "stats.json"))) {
			return true;
		}
		if (file.endsWith(path.join(".webpack", "renderer", "stats.json"))) {
			return true;
		}
		if (/[^/\\]+\.js\.map$/.test(file)) {
			return true;
		}
		return !/^[/\\]\.webpack|icons($|[/\\]).*$/.test(file);
	};

module.exports = {
	makers: [
		{
			config: {
				iconUrl: "https://cdn.discordapp.com/attachments/933328430404087818/989502310478659584/icon.ico",
				name: "Hareshi",
				setupIcon: path.join(__dirname, "/icons/win/icon.ico"),
			},
			name: "@electron-forge/maker-squirrel",
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin", "linux"], // "win32"
		},
		{
			config: {
				executableName: "hareshi",
				icon: path.join(__dirname, "/icons/mac/icon.icns"),
				mimeType: ["x-scheme-handler/hareshi"],
			},
			name: "@electron-forge/maker-deb",
		},
		{
			config: {
				executableName: "hareshi",
				homepage: "https://hareshi.net",
				icon: path.join(__dirname, "/icons/png/icon.png"),
			},
			name: "@electron-forge/maker-rpm",
		},
		{
			config: {
				icon: path.join(__dirname, "/icons/mac/icon.icns"),
			},
			name: "@electron-forge/maker-dmg",
			platforms: ["darwin"],
		},
	],
	packagerConfig: {
		// arch: ["ia32", "x64", "armv7l", "arm64"],
		// platform: ["darwin", "linux", "win32"],
		asar: true,
		executableName: "hareshi",
		icon: process.env.RUN_OS === "macos-latest" ? path.join(__dirname, "/icons/mac/icon.icns") : path.join(__dirname, "/icons/win/icon.ico"),
		ignore,
		protocols: [
			{
				name: "Hareshi",
				schemes: ["hareshi"],
			},
		],
	},
	plugins: [
		[
			"@electron-forge/plugin-electronegativity",
			{
				isSarif: true,
			},
		],
		[
			"@electron-forge/plugin-webpack",
			{
				mainConfig: "./webpack.main.config.js",
				renderer: {
					config: "./webpack.renderer.config.js",
					entryPoints: [
						{
							html: "./src/loading/main.html",
							js: "./src/loading/renderer.ts",
							name: "loading",
							preload: {
								js: "./src/loading/loading.ts",
							},
						},
						{
							js: "./src/renderer.ts",
							name: "main_window",
							preload: {
								js: "./src/preload.ts",
							},
						},
					],
				},
			},
		],
	],
	publishers: [
		{
			config: {
				draft: false,
				prerelease: process.env.prerelease || false,
				repository: {
					name: "hareshi-desktop",
					owner: "hareshi",
				},
			},
			name: "@electron-forge/publisher-github",
		},
	],
};
