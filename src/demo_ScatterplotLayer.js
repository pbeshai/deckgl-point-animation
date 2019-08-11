import mapboxgl from 'mapbox-gl';
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import GL from '@luma.gl/constants';
import { easeBackInOut } from 'd3';
import throttle from 'lodash.throttle';

import { vs, flyTo, delay } from './util';
import librariesData from './data/libraries.json';

// configuration globals
const width = 1280; // also change in style.css
const height = 720; // also change in style.css
const librariesAnimation = { enterProgress: 0, duration: 2000 };
const config = {
  // read in the access token from an environment variable (specify in .env or .env.local)
  mapboxAccessToken: process.env.MapboxAccessToken,
  mapStyles: {
    mapboxLight: 'mapbox://styles/mapbox/light-v9',
    mapboxDark: 'mapbox://styles/mapbox/dark-v9',
  },
};

// configure MapBox to use the access token
mapboxgl.accessToken = config.mapboxAccessToken;

// views & locations
const US_CENTER = [-98.5795, 39.8283];
const INITIAL_VIEW_STATE = {
  longitude: -78.8006344148876,
  latitude: 39.09086893888812,
  bearing: -29.368464314354455,
  zoom: 6.0,
  pitch: 52.84408429581342,
};
const COUNTRY_VIEW_STATE = {
  longitude: -97.01492690488716,
  latitude: 36.86409651033726,
  bearing: -2.3684643143544513,
  zoom: 3.9115186793818326,
  pitch: 30.894226099945293,
};
const COUNTRY2_VIEW_STATE = {
  longitude: -97.01492690488716,
  latitude: 36.86409651033726,
  bearing: 6.3684643143544513,
  zoom: 3.9115186793818326,
  pitch: 40.894226099945293,
};

function init() {
  // set up the map
  let mapLoaded = false;
  let deckLoaded = false;

  const map = new mapboxgl.Map({
    container: 'map',
    style: config.mapStyles.mapboxDark,
    interactive: false, // deck.gl will handle map interaction
    ...INITIAL_VIEW_STATE,
    center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
    // preserveDrawingBuffer: true, // enable this if recording
  });

  map.on('load', () => {
    mapLoaded = true;
    start();
  });

  // set up deckgl
  const deck = new Deck({
    canvas: 'deckgl-overlay',
    glOptions: {
      // preserveDrawingBuffer: true, // enable this if recording
    },
    width: width,
    height: height,
    initialViewState: INITIAL_VIEW_STATE,
    controller: true, // deck.gl handles map interaction

    onViewStateChange({ viewState }) {
      // keep the map in sync with deckGL's view
      map.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch,
      });

      // make it easy to get the current view by writing window.debug = true in the console
      if (window.debug) {
        vs(viewState);
      }
    },

    onClick(evt) {
      // add a marker on the map wherever you clicked
      new mapboxgl.Marker().setLngLat(evt.lngLat).addTo(map);
      console.log('clicked at', evt.lngLat);
    },

    onLoad() {
      deckLoaded = true;
      start();
    },
    layers: [],
  });

  // initialize the deck layers
  updateLayers(deck);

  // when both map and deck are loaded, start the animation
  function start() {
    if (mapLoaded && deckLoaded) {
      animate(deck);
    }
  }
}

// throttle update layers so the animation callback doesn't run too frequently
const updateLayers = throttle(function updateLayersRaw(deck) {
  const layers = [];
  const librariesLayer = new ScatterplotLayer({
    id: 'points-layer',
    data: librariesData,
    getPosition: d => d.position,
    getFillColor:
      librariesAnimation.enterProgress === 0 ? [255, 255, 255] : [60, 100, 200],
    getRadius: librariesAnimation.enterProgress === 0 ? 0 : 5000,
    parameters: {
      // prevent flicker from z-fighting
      [GL.DEPTH_TEST]: false,

      // turn on additive blending to make them look more glowy
      [GL.BLEND]: true,
      [GL.BLEND_SRC_RGB]: GL.ONE,
      [GL.BLEND_DST_RGB]: GL.ONE,
      [GL.BLEND_EQUATION]: GL.FUNC_ADD,
    },
    transitions: {
      getFillColor: {
        duration: librariesAnimation.duration,
      },
      getRadius: {
        duration: librariesAnimation.duration,
        easing: easeBackInOut,
      },
    },
  });
  layers.push(librariesLayer);

  deck.setProps({
    layers,

    // TODO: may be a bug, but this is required to prevent transitions from restarting
    viewState: deck.viewState,
  });
}, 8);

// update deck layers to animate in the libraries
async function animateLibraries(deck) {
  // draw in libraries
  librariesAnimation.enterProgress = 1;
  updateLayers(deck);

  // wait for the animation to finish
  await delay(librariesAnimation.duration);
}

// run the whole animation
async function animate(deck) {
  console.log('start animation');

  const flyPromise = flyTo(deck, COUNTRY_VIEW_STATE, 3000).then(() => {
    // continue camera motion even if still animating in libraries
    return flyTo(deck, COUNTRY2_VIEW_STATE, 8000);
  });

  await animateLibraries(deck);

  // wait for the camera motion to finish before ending
  await flyPromise;

  console.log('animation finished');
}

// kick off the whole thing
init();
