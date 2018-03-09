var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: "./app/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
  },
  plugins: [new HtmlWebpackPlugin({
    template: "./app/index.html"
  }), new CopyWebpackPlugin([{
    from: "app/assets", to: "assets"
  }])],
  module: {
    loaders: [
      {test: /\.tsx?$/, loader: "ts-loader"},
      {test: /\.css/, loader: "style-loader!css-loader"}
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 8080
  }
};
