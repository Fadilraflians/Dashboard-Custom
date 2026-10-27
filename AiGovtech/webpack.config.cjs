const path = require("node:path");
const { ModuleFederationPlugin } = require("webpack").container;
const { dependencies } = require("./package.json");

module.exports = (_env, argv) => ({
  mode: argv.mode || "development",
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    publicPath: "auto",
    clean: true,
  },
  resolve: { extensions: [".tsx", ".ts", ".js"] },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: { loader: "ts-loader", options: { transpileOnly: true } },
        exclude: /node_modules/,
      },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "aiGovtech",
      filename: "remoteEntry.js",
      exposes: { "./mount": "./src/app/mount.tsx" },
      shared: {
        react: {
          singleton: true,
          eager: true,
          requiredVersion: dependencies.react,
        },
        "react-dom": {
          singleton: true,
          eager: true,
          requiredVersion: dependencies["react-dom"],
        },
      },
    }),
  ],
  devServer: {
    port: process.env.MFE_PORT || 3024,
    historyApiFallback: true,
    hot: true,
    headers: { "Access-Control-Allow-Origin": "*" },
    proxy: [
      {
        context: ["/api/gateway"],
        target: process.env.SHELL_API_URL || "http://localhost:3000",
        changeOrigin: true,
      },
    ],
  },
});