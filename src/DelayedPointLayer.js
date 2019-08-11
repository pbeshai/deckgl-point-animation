import { ScatterplotLayer } from '@deck.gl/layers';

const fs = `
#define SHADER_NAME delayed-point-layer-fragment-shader

precision highp float;
uniform bool filled;
uniform float animationProgress;
varying vec4 vFillColor;
varying vec4 vLineColor;
varying vec2 unitPosition;
varying float innerUnitRadius;
varying float instanceAnimationProgress;

#ifndef PI
#define PI 3.141592653589793
#endif

// easing function
float backOut(float t) {
  float f = 1.0 - t;
  return 1.0 - (pow(f, 3.0) - f * sin(f * PI));
}

void main(void) {
  // delay is a value between 0 and 1 indicating how delayed it should be
  float t = instanceAnimationProgress;

  // divide by 0.75 to say how long it should increase size by
  // (size animation should be done at 75% through the animation, color anim continues)
  float tSize = backOut(clamp(t / 0.75, 0.0, 1.0));

  // our points actually render at half the size specified. This allows them
  // to exceed their desired size before settling into it without clipping.
  // In theory, we could modify the vertex shader to account for this, but
  // easiser to just supply a bigger radius for now...
  float maxSize = clamp(tSize * 0.5, 0.0, 1.0);

  float distToCenter = length(unitPosition);
  if (distToCenter > maxSize) { // @pbeshai edit - was 1.0
    discard;
  }

  if (distToCenter > innerUnitRadius) {
    gl_FragColor = vLineColor;
  } else if (filled) {
    gl_FragColor = vFillColor;
  } else {
    discard;
  }
  // use highlight color if this fragment belongs to the selected object.
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);
  // use picking color if rendering to picking FBO.
  gl_FragColor = picking_filterPickingColor(gl_FragColor);

  // start at this color (white) and animate into the final color
  vec4 enterColor = vec4(1.0);

  // t * t to use quadratic-ish easing
  gl_FragColor = mix(enterColor, gl_FragColor, t * t);
}
`;

class DelayedPointLayer extends ScatterplotLayer {
  initializeState() {
    super.initializeState();
    this.getAttributeManager().addInstanced({
      instanceDelayFactor: {
        size: 1,
        accessor: 'getDelayFactor',
      },
    });
  }

  // override getShaders to inject into vertex shader and add a new fragment shader
  getShaders() {
    return Object.assign({}, super.getShaders(), {
      // inject: https://github.com/uber/luma.gl/blob/master/docs/api-reference/shadertools/assemble-shaders.md
      inject: {
        // inject at vertex shader (`vs`) declarations
        'vs:#decl': `
        attribute float instanceDelayFactor;
        uniform float animationProgress;
        uniform float numPoints;
        uniform float pointDuration;
        varying float instanceAnimationProgress;

        float delayedAnimationProgress(float instanceDelayFactor, float animationProgress, float pointDuration) {
          float delayProportion = 1.0 - pointDuration;
          float delay = instanceDelayFactor * delayProportion;

          // instanceDelayFactor = 0 => animationProgress: 0 to (1 - delayProportion) ===> 0 to 1
          // instanceDelayFactor = 1 => animationProgress: delayProportion to 1 ===> 0 to 1
          return clamp((animationProgress - delay) / pointDuration, 0.0, 1.0);
        }
        `,

        // inject at vertex shader (`vs`) end of function
        'vs:#main-end': `
        instanceAnimationProgress = delayedAnimationProgress(instanceDelayFactor, animationProgress, pointDuration);
        `,
      },
      // add new fragment shader (`fs`)
      fs,
    });
  }

  // override draw fucntion
  draw(opts) {
    // pointDuration = proportion of animation that is used to animate an individual (value between 0 and 1 where 1 is full duration)
    // animationProgress = how far through the animation we are (value between 0 and 1)
    const { animationProgress = 0.0, pointDuration = 0.25, data } = this.props;

    // add uniforms
    const uniforms = Object.assign({}, opts.uniforms, {
      animationProgress,
      pointDuration,
      numPoints: data.length,
    });
    super.draw(Object.assign({}, opts, { uniforms }));
  }
}

const defaultProps = {
  // when a given point begins animating (value between 0 and 1)
  // 0 = the first point to animate, 1 = the last point to animate
  // the last point begins animating when animationProgress = 1 - pointDuration.
  getDelayFactor: { type: 'accessor', value: 0.0 },
};

DelayedPointLayer.defaultProps = Object.assign(
  {},
  ScatterplotLayer.defaultProps,
  defaultProps
);

export default DelayedPointLayer;
