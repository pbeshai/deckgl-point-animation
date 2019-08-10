import { FlyToInterpolator } from '@deck.gl/core';

/** Helper to delay specified number of milliseconds before moving on */
export async function delay(ms) {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve();
    }, ms)
  );
}

/**
 * debug func for printing viewstate
 */
export function vs(viewState) {
  const obj = {
    longitude: viewState.longitude,
    latitude: viewState.latitude,
    bearing: viewState.bearing,
    zoom: viewState.zoom,
    pitch: viewState.pitch,
  };
  console.log(JSON.stringify(obj));
}

/**
 * Helper to get DeckGL to fly to a location with a transition
 */
export function flyTo(
  deck,
  { longitude, latitude, zoom, pitch, bearing },
  duration = 1000,
  extraViewState = {}
) {
  return new Promise(resolve => {
    console.log(
      '[fly transition] flying to',
      longitude,
      latitude,
      zoom,
      pitch,
      bearing
    );
    deck.setProps({
      viewState: {
        longitude: longitude,
        latitude: latitude,
        zoom,
        pitch,
        bearing,
        transitionDuration: duration,
        transitionInterpolator: new FlyToInterpolator(),
        onTransitionStart: () => {
          console.log('[fly transition] starting');
        },
        onTransitionInterrupt: () => {
          console.log('[fly transition] interrupted');
        },
        onTransitionEnd: () => {
          console.log('[fly transition] ended');
          resolve();
        },
        ...extraViewState,
      },
    });
  });
}
