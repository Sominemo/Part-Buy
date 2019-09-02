var path = require('path');
var webpack = require('webpack');

const TerserPlugin = require("terser-webpack-plugin")

module.exports = {
    entry: './src.js',
    output: {
        path: path.resolve(__dirname),
        filename: 'script.js'
    },
    mode: "production",
    optimization: {

        minimizer: [
            new TerserPlugin({
                parallel: true,
                sourceMap: true,
                cache: true,
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                        babelrc: true,
                    },
                },
            },
        ],
    },
};