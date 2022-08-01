module.exports = [
	{
		test: /native_modules\/.+\.node$/,
		use: "node-loader",
	},
	{
		parser: { amd: false },
		test: /\.(m?js|node)$/,
		use: {
			loader: "@vercel/webpack-asset-relocator-loader",
			options: {
				outputAssetBase: "native_modules",
			},
		},
	},
	{
		exclude: /(node_modules|.webpack)/,
		test: /\.tsx?$/,
		use: [
			{
				loader: "ts-loader",
				options: {
					transpileOnly: true,
				},
			},
		],
	},
];
