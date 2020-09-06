const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
  entry: ['./src/index.ts'],
  mode: 'production',
  externals: [nodeExternals()],
  output: {
    filename: 'api.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/},
      {test: /\.json/, loader: 'json-loader', exclude: /node_modules/},
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    plugins: [new TsconfigPathsPlugin()],
  },
  target: 'node',
  node: {__dirname: true},
  plugins: [new webpack.IgnorePlugin(/^pg-native$/)],
};
