import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* =========================================================================
   Utilities
   ========================================================================= */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);
const V1 = new THREE.Vector3(1, 1, 1);
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpV3 = new THREE.Vector3();
const tmpQ = new THREE.Quaternion(), tmpM = new THREE.Matrix4();
const pad4 = n => String(n).padStart(4, '0');
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const strHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
class RNG {
  constructor(seed) { this.f = mulberry32(seed >>> 0); }
  next() { return this.f(); }
  range(a, b) { return a + (b - a) * this.f(); }
  int(a, b) { return Math.floor(a + (b - a + 1) * this.f()); }
  pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
  chance(p) { return this.f() < p; }
  sign() { return this.f() < 0.5 ? -1 : 1; }
  weighted(items) { // [[value, weight], ...]
    let tot = 0; for (const it of items) tot += Math.max(0, it[1]);
    let r = this.f() * tot;
    for (const it of items) { r -= Math.max(0, it[1]); if (r <= 0) return it[0]; }
    return items[items.length - 1][0];
  }
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.f() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
}
let rng = new RNG(Date.now());
const FXR = new RNG(987654);

/* =========================================================================
   Persistence / settings
   ========================================================================= */
const store = {
  get(k, d) { try { const v = localStorage.getItem('aooni.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('aooni.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
const IS_TOUCH = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && matchMedia('(pointer: coarse)').matches;
if (IS_TOUCH) document.body.classList.add('touch');
const BASE_EXPOSURE = 1.25;   // overall brightness (+25%); the settings slider scales this
const SETTINGS = Object.assign({ quality: IS_TOUCH ? 'medium' : 'high', sens: 1, fov: 70, volume: 0.85, bright: 1, fps: 0 }, store.get('settings', {}));
const saveSettings = () => store.set('settings', SETTINGS);

/* =========================================================================
   Renderer / scene / post-processing
   ========================================================================= */
const canvas = $('c');
let renderer, composer = null, bloomPass = null, gradePass = null;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x050608, 0.03);
/* Stage size: inside 3dgame the stage may be turned 90deg (横画面), so width/height swap */
const ROT = { on: false };
const VW = () => (ROT.on ? innerHeight : innerWidth), VH = () => (ROT.on ? innerWidth : innerHeight);
const toStage = (cx, cy) => (ROT.on ? { x: cy, y: innerWidth - cx } : { x: cx, y: cy });
/* Settings handed down by the 3dgame home screen (only when embedded there) */
const HUB = { embedded: window.parent !== window, vol: 1, sens: 1 };
const camera = new THREE.PerspectiveCamera(SETTINGS.fov, VW() / VH(), 0.04, 140);
camera.rotation.order = 'YXZ';
scene.add(camera);
const hemi = new THREE.HemisphereLight(0xc4a27e, 0x2a1c12, 0.34);
scene.add(hemi);
const QUALITY = {
  low: { pr: 1, pool: 5, shadows: 0, bloom: false, tex: 512, aa: false },
  medium: { pr: Math.min(devicePixelRatio, 1.5), pool: 7, shadows: 0, bloom: true, tex: 1024, aa: false },
  high: { pr: Math.min(devicePixelRatio, 2), pool: 10, shadows: 1, bloom: true, tex: 1024, aa: true },
};
const Q = () => QUALITY[SETTINGS.quality] || QUALITY.medium;

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, time: { value: 0 }, grain: { value: 0.045 }, aberr: { value: 0.0 },
    desat: { value: 0.0 }, tint: { value: new THREE.Color(1, 1, 1) }, tintAmt: { value: 0 }, warp: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, grain, aberr, desat, tintAmt, warp; uniform vec3 tint; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      if (warp > 0.0) uv += vec2(sin(uv.y*40.0 + time*9.0), cos(uv.x*30.0 + time*7.0)) * 0.004 * warp;
      vec2 d = uv - 0.5;
      vec3 col;
      if (aberr > 0.0001) {
        col.r = texture2D(tDiffuse, uv + d * aberr).r;
        col.g = texture2D(tDiffuse, uv).g;
        col.b = texture2D(tDiffuse, uv - d * aberr).b;
      } else col = texture2D(tDiffuse, uv).rgb;
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(l), desat);
      col = mix(col, l * tint * 1.7 + tint * 0.04, tintAmt);
      col += (hash(uv * 873.0 + fract(time * 7.13) * 91.0) - 0.5) * grain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

function setupRenderer() {
  const q = Q();
  if (renderer) { renderer.dispose(); }
  renderer = new THREE.WebGLRenderer({ canvas, antialias: q.aa, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(q.pr);
  renderer.setSize(VW(), VH(), false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = BASE_EXPOSURE * SETTINGS.bright;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = q.shadows > 0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  composer = null; bloomPass = null; gradePass = null;
  if (q.bloom) {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(q.pr);
    composer.setSize(VW(), VH());
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(VW(), VH()), 0.5, 0.5, 0.86);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    gradePass = new ShaderPass(GradeShader);
    composer.addPass(gradePass);
  }
}
function onResize() {
  const r = $('rot');
  r.style.width = VW() + 'px'; r.style.height = VH() + 'px';
  r.style.transform = ROT.on ? 'rotate(90deg) translateY(-100%)' : 'none';
  document.documentElement.style.setProperty('--sw', VW() / 100 + 'px'); document.documentElement.style.setProperty('--sh', VH() / 100 + 'px');
  document.body.classList.toggle('short', VH() < 520);
  camera.aspect = VW() / VH();
  camera.updateProjectionMatrix();
  if (renderer) renderer.setSize(VW(), VH(), false);
  if (composer) composer.setSize(VW(), VH());
}
addEventListener('resize', onResize);
setupRenderer();
const maxAniso = () => Math.min(8, renderer.capabilities.getMaxAnisotropy());

/* Short UI/prop animations are stepped from the main loop: a second requestAnimationFrame
   loop can be starved by a host page's frame limiter. fn returns true while it wants more frames. */
const ANIMS = new Set();
const animate = fn => { if (fn() !== false) ANIMS.add(fn); };
function stepAnims() { for (const fn of [...ANIMS]) { let more = false; try { more = fn() === true; } catch (e) { more = false; } if (!more) ANIMS.delete(fn); } }

/* Post FX state shared by gameplay */
const POST = { tint: new THREE.Color(1, 1, 1), tintAmt: 0, aberr: 0, desat: 0, warp: 0, shake: 0, hurt: 0, flash: 0 };
