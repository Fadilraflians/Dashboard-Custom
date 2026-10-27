const path = require("node:path");
const { ModuleFederationPlugin } = require("webpack").container;
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { dependencies } = require("./package.json");
require("dotenv").config();

// Shared UI remote. Scope name must be a valid JS identifier (no dashes) and
// must match the consumers' remote key (mfe-a/mfe-b webpack `remotes`).
// HARDCODED (static identity) — never changes per environment.
const SCOPE = "sharedUi";

const buildConfig = function buildConfig(_env, argv) {
  const isProduction = (argv && argv.mode) === "production";
  return {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    // "auto": the bundle detects its own origin at runtime (from where
    // remoteEntry.js is loaded), so no build-time URL is baked in and it works
    // behind any reverse proxy / domain without a rebuild.
    publicPath: "auto",
    clean: true,
  },
  // Asset-size hint only in production. In development webpack does not minify,
  // so bundles are much larger and would always trip the budget — a dev-only
  // false alarm. The prod budget still catches real bloat.
  performance: {
    hints: isProduction ? "warning" : false,
    // Ignore large vendor fonts/images. The JS/CSS budget accommodates the
    // known React + PrimeReact vendor bundle (hashed + immutably cached). The
    // hint still fires on genuinely unexpected JS/CSS bloat beyond that.
    assetFilter: (assetFilename) =>
      !/\.(woff2?|ttf|eot|svg|png|jpe?g|gif|webp)$/.test(assetFilename),
    maxAssetSize: 1.5 * 1024 * 1024,
    maxEntrypointSize: 1.5 * 1024 * 1024,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: { loader: "ts-loader", options: { transpileOnly: true } },
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
                localIdentName: "[name]__[local]--[hash:base64:5]",
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        // postcss-loader runs Tailwind + autoprefixer (see postcss.config.cjs)
        // for plain .css like src/styles/tailwind.css.
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: SCOPE,
      filename: "remoteEntry.js",
      exposes: {
        // Standalone card components — each self-contained (own icon, color,
        // format, label). The consuming MFE renders them inside its own React
        // tree, so React MUST be shared (singleton) between remote + consumer.
                "./LineChartMonthlySales":
          "./src/components/LineChartMonthlySales/LineChartMonthlySales.tsx",
        "./BarChartMonthlySales":
          "./src/components/BarChartMonthlySales/BarChartMonthlySales.tsx",
        "./DonutProductChart":
          "./src/components/DonutProductChart/DonutProductChart.tsx",
        "./CategoryBarChart":
          "./src/components/CategoryBarChart/CategoryBarChart.tsx",
        "./AnalyticsPieChart":
          "./src/components/AnalyticsVisualizations/PieChart.tsx",
        "./AnalyticsAreaChart":
          "./src/components/AnalyticsVisualizations/AreaChart.tsx",
        "./AnalyticsScatterChart":
          "./src/components/AnalyticsVisualizations/ScatterChart.tsx",
        "./AnalyticsDataTable":
          "./src/components/AnalyticsVisualizations/AnalyticsTable.tsx",
        "./AnalyticsMetricCard":
          "./src/components/AnalyticsVisualizations/AnalyticsMetricCard.tsx",
        "./TrendAlokasiChart":
          "./src/components/BudgetDashboardCharts/TrendAlokasiChart.tsx",
        "./DonutSubprogramChart":
          "./src/components/BudgetDashboardCharts/DonutSubprogramChart.tsx",
        // One generic metric card used for EVERY card on the custom dashboard,
        // so all cards share the same look (icon/label/value come from data).
        "./MetricCard": "./src/components/MetricCard/MetricCard.tsx",
        "./TotalPendapatanFashionCard":
          "./src/components/TotalPendapatanFashionCard/TotalPendapatanFashionCard.tsx",
        "./TransaksiFashionCard":
          "./src/components/TransaksiFashionCard/TransaksiFashionCard.tsx",
        "./TotalPendapatanCard":
          "./src/components/TotalPendapatanCard/TotalPendapatanCard.tsx",
        "./TransaksiCard": "./src/components/TransaksiCard/TransaksiCard.tsx",
        "./DashboardKpiCard":
          "./src/components/DashboardKpiCard/DashboardKpiCard.tsx",
        "./AbsorptionSummaryPanel":
          "./src/components/AbsorptionSummaryPanel/AbsorptionSummaryPanel.tsx",
        "./PusatInformasi": "./src/components/PusatInformasi/index.tsx",
        "./SummaryLevelGiro":
          "./src/components/SummaryLevelGiro/index.tsx",
        "./SummaryLevelVa":
          "./src/components/SummaryLevelVa/index.tsx",
        "./BalanceFilterPanel":
          "./src/components/BalanceFilterPanel/index.tsx",
        "./DistributionFilterPanel":
          "./src/components/DistributionFilterPanel/index.tsx",
        "./DistributionMapPanel":
          "./src/components/DistributionMapPanel/index.tsx",
        "./UploadPaguSummaryCard":
          "./src/components/UploadPaguSummaryCard/index.tsx",
        "./UploadPaguTemplateCard":
          "./src/components/UploadPaguTemplateCard/index.tsx",
        "./UploadPaguStatusPill":
          "./src/components/UploadPaguStatusPill/index.tsx",
        "./KoreksiGiroPage":
          "./src/components/KoreksiDashboard/KoreksiGiroPage.tsx",
        "./KoreksiVaPage":
          "./src/components/KoreksiDashboard/KoreksiVaPage.tsx",
        "./MutasiBungaPage":
          "./src/components/SlicedDataPage/MutasiBungaPage.tsx",
        "./MutasiRkudPage":
          "./src/components/SlicedDataPage/MutasiRkudPage.tsx",
        "./BuktiKirimJasaGiroPage":
          "./src/components/SlicedDataPage/BuktiKirimJasaGiroPage.tsx",
        "./PrintDgoPage":
          "./src/components/SlicedDataPage/PrintDgoPage.tsx",
        "./CheckDuplikasiRpdPage":
          "./src/components/SlicedDataPage/CheckDuplikasiRpdPage.tsx",
        "./DownloadFilePage":
          "./src/components/SlicedDataPage/DownloadFilePage.tsx",
        "./UserManualPage":
          "./src/components/UserManual/UserManualPage.tsx",
        "./RekapBungaPage":
          "./src/components/BungaDashboard/RekapBungaPage.tsx",
        "./PembayaranBungaPage":
          "./src/components/BungaDashboard/PembayaranBungaPage.tsx",
        // Design tokens (light + dark). Imported once by a consumer; the
        // CSS variables land on :root/<html> and apply everywhere.
        "./theme.css": "./src/styles/theme.css",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: dependencies.react,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: dependencies["react-dom"],
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
  devServer: {
    port: process.env.SHARED_PORT || 9000,
    historyApiFallback: true,
    hot: true,
    // webpack-dev-server v5 is strict about the Host header and rejects
    // cross-origin requests with 403 Forbidden by default. The MFEs load this
    // remoteEntry.js cross-origin (from :3001/:3002), so allow all hosts and
    // send permissive CORS headers for the dev remote.
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  },
  };
};

module.exports = buildConfig;
