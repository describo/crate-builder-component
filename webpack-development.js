const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack-common");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

const configuration = merge(common, {
    mode: "development",
    devtool: "eval-source-map",
    devServer: {
        static: {
            directory: path.join(__dirname, "dist"),
        },
        compress: true,
        host: "0.0.0.0",
        port: 9000,
        historyApiFallback: true,
        hot: true,
    },
    plugins: [
        new webpack.DefinePlugin({
            PRODUCTION: JSON.stringify(false),
            DEVELOPMENT: JSON.stringify(true),
            // VERSION: JSON.stringify("5fa3b9"),
            __VUE_OPTIONS_API__: JSON.stringify(true),
            __VUE_PROD_DEVTOOLS__: JSON.stringify(true),
        }),
    ],
});

module.exports = configuration;
