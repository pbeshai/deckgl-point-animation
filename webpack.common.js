const path = require('path');
const resolve = path.resolve;
const Dotenv = require('dotenv-webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    scatterplot: resolve('./src/demo_ScatterplotLayer.js'),
    delayedpoint: resolve('./src/demo_DelayedPointLayer.js'),
  },

  resolve: {
    alias: {
      // From mapbox-gl-js README. Required for non-browserify bundlers (e.g. webpack):
      'mapbox-gl$': resolve('./node_modules/mapbox-gl/dist/mapbox-gl.js'),
    },
  },

  output: {
    filename: '[name].bundle.js',
    path: path.join(__dirname, 'docs'),
  },

  plugins: [
    new CopyPlugin(['src/index.html', 'src/scatterplot.html', 'src/style.css']),
    // Read from .env file to get mapbox token (.env.local overrides .env)
    new Dotenv({ path: path.join(__dirname, '.env.local') }),
    new Dotenv({ path: path.join(__dirname, '.env') }),
  ],
};
