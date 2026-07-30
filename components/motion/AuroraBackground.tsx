"use client";

import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  getAuroraStops,
  getAuroraTheme,
  subscribeAuroraTheme,
  type AuroraTheme,
} from "@/lib/motion/auroraTheme";

const AMPLITUDE = 0.85;
const BLEND = 0.6;
const SPEED = 0.35;
/** 색 전환 시간상수. 클수록 더 천천히 "스윽" 넘어간다. */
const COLOR_TAU_MS = 900;
/** 색이 바뀌는 동안 진폭을 더해 한 번 일렁이게 만든다. */
const TRANSITION_SWELL = 0.5;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {   \
  int index = 0;                                   \
  for (int i = 0; i < 2; i++) {                    \
    ColorStop currentColor = colors[i];            \
    bool isInBetween = currentColor.position <= factor; \
    index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                \
  ColorStop currentColor = colors[index];          \
  ColorStop nextColor = colors[index + 1];         \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

function themeStops(theme: AuroraTheme) {
  return getAuroraStops(theme).map((hex) => {
    const color = new Color(hex);
    return [color.r, color.g, color.b];
  });
}

/**
 * 상단에 은은하게 흐르는 오로라 배경(D-23).
 * reduced-motion에서는 WebGL을 초기화하지 않고 정적 그라디언트(body 배경)만 남긴다.
 */
export function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useSyncExternalStore(subscribeAuroraTheme, getAuroraTheme, defaultTheme);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      // WebGL2를 쓸 수 없는 환경에서는 정적 배경으로 조용히 폴백한다.
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";

    const geometry = new Triangle(gl);
    delete geometry.attributes.uv;

    let activeTheme = getAuroraTheme();
    let target = themeStops(activeTheme);
    const stops = target.map((rgb) => [...rgb]);

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: AMPLITUDE },
        uColorStops: { value: stops },
        uResolution: { value: [container.offsetWidth, container.offsetHeight] },
        uBlend: { value: BLEND },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    const resize = () => {
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };
    resize();

    let frameId = 0;
    let previousElapsed = 0;
    const update = (elapsed: number) => {
      frameId = requestAnimationFrame(update);

      // 탭 복귀 후 큰 dt로 색이 순간 이동하지 않도록 상한을 둔다.
      const delta = previousElapsed ? Math.min(64, elapsed - previousElapsed) : 16;
      previousElapsed = elapsed;

      const nextTheme = getAuroraTheme();
      if (nextTheme !== activeTheme) {
        activeTheme = nextTheme;
        target = themeStops(nextTheme);
      }

      // 프레임 레이트와 무관한 지수 보간으로 목표 색까지 서서히 넘어간다.
      const factor = 1 - Math.exp(-delta / COLOR_TAU_MS);
      let remaining = 0;
      stops.forEach((rgb, stopIndex) => {
        rgb.forEach((channel, channelIndex) => {
          const goal = target[stopIndex][channelIndex];
          rgb[channelIndex] = channel + (goal - channel) * factor;
          remaining += Math.abs(goal - rgb[channelIndex]);
        });
      });

      program.uniforms.uTime.value = elapsed * 0.001 * SPEED;
      program.uniforms.uAmplitude.value = AMPLITUDE + Math.min(1, remaining) * TRANSITION_SWELL;
      renderer.render({ scene: mesh });
    };

    // 탭이 가려진 동안에는 프레임을 돌리지 않는다.
    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const start = () => {
      if (!frameId) frameId = requestAnimationFrame(update);
    };
    const handleVisibility = () => (document.hidden ? stop() : start());

    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`tg-aurora${theme === "default" ? "" : " is-focus"}`}
      aria-hidden
    />
  );
}

function defaultTheme(): AuroraTheme {
  return "default";
}
