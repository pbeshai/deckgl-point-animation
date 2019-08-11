const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = merge(
  {
    plugins: [new CleanWebpackPlugin()],
  },
  common,
  {
    mode: 'production',
    devtool: 'source-map',
  }
);
