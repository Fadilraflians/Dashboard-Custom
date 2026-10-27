const path = require("node:path");
const { ModuleFederationPlugin } = require("webpack").container;
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { dependencies } = require("./package.json");

const SHARED_SCOPE = "sharedUi";

module.exports = (_env, argv) => ({
  mode: argv?.mode || "development",
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    publicPath: "auto",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.module\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              esModule: false,
              modules: {
                namedExport: false,
                exportLocalsConvention: "asIs",
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "customDashboard",
      filename: "remoteEntry.js",
      exposes: {
        "./mount": "./src/app/mount.tsx",
      },
      remotes: {
        [SHARED_SCOPE]: `promise new Promise(function (resolve) {
          var scope = ${JSON.stringify(SHARED_SCOPE)};
          var runtime = (typeof window !== "undefined" && window.__MFE_RUNTIME__) || {};
          var url = runtime.sharedUrl || "http://localhost:9000/remoteEntry.js";
          function fallback(reason) {
            return { init: function () {}, get: function () { return Promise.resolve(function () { return { default: { __unavailable__: true, reason: reason } }; }); } };
          }
          var script = document.createElement("script");
          script.src = url;
          script.async = true;
          script.onload = function () { resolve(window[scope] || fallback("container not found")); script.remove(); };
          script.onerror = function () { resolve(fallback("shared UI remote unavailable")); script.remove(); };
          document.head.appendChild(script);
        })`,
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: dependencies.react },
        "react-dom": { singleton: true, eager: true, requiredVersion: dependencies["react-dom"] },
      },
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
  devServer: {
    port: 3025,
    historyApiFallback: true,
    hot: true,
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});
