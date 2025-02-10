const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  // Define multiple entry points: one for AWS Lambda and one for local testing.
  entry: {
    lambda: "./lambda.ts", // Bundle for AWS Lambda deployment.
  },
  target: "node", // Since AWS Lambda runs on Node.js.
  mode: "production", // You can change to 'development' if needed.
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    // The [name] placeholder creates two files: lambda.js and index.js in the dist folder.
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    libraryTarget: "commonjs2", // This is important for AWS Lambda.
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        // Prevents extraction of license comments into separate files.
        extractComments: false,
      }),
    ],
  },
};
