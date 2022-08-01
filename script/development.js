const spawn = require("node:child_process").spawn,
	chokidar = require("chokidar"),
	kill = require("tree-kill"),
	path = require("node:path");

const development = {
	reload() {
		if (this.childProcess) kill(this.childProcess.pid);
		this.childProcess = spawn("yarn run start_dev", [], {
			shell: true,
			stdio: "inherit",
		});
	},
	start() {
		this.args = process.argv;
		this.command = this.args[2];
		this.cwd = process.cwd();
		this.watchPaths = [path.join(this.cwd, "/src/**/*.ts")];
		this.ignoredPaths = "**/node_modules/*";
		this.startWatching();
		this.reload();
	},
	startWatching() {
		chokidar
			.watch(this.watchPaths, {
				ignoreInitial: true,
				ignored: this.ignoredPaths,
			})
			.on("all", () => {
				this.reload();
			});
	},
};

development.start();
