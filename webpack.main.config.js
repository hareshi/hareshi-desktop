module.exports = {
	entry: "./src/handle/squirrel.ts",
	mode: "development",
	module: {
		rules: require("./webpack.rules"),
	},
	resolve: {
		extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
	},
};
