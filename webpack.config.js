// NOTE: To use this example standalone (e.g. outside of deck.gl repo)
// delete the local development overrides at the bottom of this file

const path = require('path');
const resolve = path.resolve;
const Dotenv = require('dotenv-webpack');

const CONFIG = {
  mode: 'development',
  devtool: 'eval',

  entry: {
    scatterplot: resolve('./demo_ScatterplotLayer.js'),
    delayedpoint: resolve('./demo_DelayedPointLayer.js'),
  },

  resolve: {
    alias: {
      // From mapbox-gl-js README. Required for non-browserify bundlers (e.g. webpack):
      'mapbox-gl$': resolve('./node_modules/mapbox-gl/dist/mapbox-gl.js'),
    },
  },

  // Read from .env file to get mapbox token (.env.local overrides .env)
  plugins: [
    new Dotenv({ path: path.join(__dirname, '.env.local') }),
    new Dotenv({ path: path.join(__dirname, '.env') }),
  ],
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env =>
  env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG;
