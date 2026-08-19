/* ==============================================================================================
   THE 3D LAYER — renderer.  Framework-free, dependency-free, opt-in.

   THREE IS INJECTED, NOT IMPORTED.
   `createBackdrop(canvas, THREE, opts)` takes the three.js namespace as an argument. Instrument
   therefore has no dependency on three, ships no three code, and stays installable by a consumer
   that will never render a scene. It also makes lazy-loading the caller's decision rather than a
   bundler setting:

     const THREE = await import("three");            // 230 KiB gz — paid only here
     const scene = createBackdrop(canvas, THREE);

   FRAMEWORK-FREE ON PURPOSE. The highest-identity surface in this fleet (the Discord Activity hub)
   is vanilla JS with no React at all, while Flightdeck is React. A React-only layer would have been
   unusable by the surface that wanted it most. React Three Fiber can wrap this; nothing here needs
   it to.

   INSTANCED FROM DAY ONE. Measured on this fleet's own topology prototype: per-object three.js
   collapsed to 48 fps at 2000 objects where an InstancedMesh held 143 fps. A non-instanced
   decorative layer buys nothing it cannot buy more cheaply in CSS, so this module only does the
   instanced kind.

   THE CONTRACT WITH CSS. Everything configurable is read from the cascade (see three.css) at
   create() time and again on `refresh()`. `--i-3d: none` means no context is ever created.
   ============================================================================================== */

const LAYER_CLASS = "i-3d";

/** Read a custom property off an element's computed style, trimmed. */
function prop(styles, name, fallback = "") {
  const v = styles.getPropertyValue(name);
  return v ? v.trim() : fallback;
}

/** A unitless multiplier token, clamped to something a scene can survive. */
function num(styles, name, fallback, max = 8) {
  const raw = parseFloat(prop(styles, name));
  if (!Number.isFinite(raw) || raw < 0) return fallback;
  return Math.min(raw, max);
}

/**
 * Read the whole 3D contract out of the cascade. Exported because it is genuinely useful on its
 * own: a caller can ask "would this theme even render?" without constructing anything.
 */
export function readThemeConfig(el = document.documentElement) {
  const s = getComputedStyle(el);
  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    enabled: prop(s, "--i-3d", "auto") !== "none",
    density: num(s, "--i-3d-density", 1),
    motion: reduced ? 0 : num(s, "--i-3d-motion", 1),
    depth: num(s, "--i-3d-depth", 1),
    scale: num(s, "--i-3d-scale", 1),
    ground: prop(s, "--i-3d-ground", "#000"),
    form: prop(s, "--i-3d-form", "#888"),
    accent: prop(s, "--i-3d-accent", "#888"),
    accent2: prop(s, "--i-3d-accent-2", "#888"),
    reduced,
  };
}

/** The no-op handle. Returned when a theme says `none`, or when WebGL is unavailable. */
function inertHandle(reason) {
  return {
    ok: false,
    reason,
    start() {},
    stop() {},
    refresh() {},
    dispose() {},
    get info() {
      return { drawCalls: 0, instances: 0, reason };
    },
  };
}

/**
 * Build the themed backdrop. Returns a handle even when it does nothing, so callers never branch
 * on null.
 *
 * @param {HTMLCanvasElement} canvas  a canvas the caller owns and positions
 * @param {object} THREE              the three.js namespace, injected
 * @param {object} [opts]
 * @param {HTMLElement} [opts.themeEl] element to read the cascade from (default <html>)
 * @param {number} [opts.count]        base instance count before density scaling
 */
export function createBackdrop(canvas, THREE, opts = {}) {
  if (!canvas || !THREE) return inertHandle("missing canvas or three");

  const themeEl = opts.themeEl || document.documentElement;
  let cfg = readThemeConfig(themeEl);

  // The load-bearing line: a theme that says `none` costs nothing at all. No context, no scene,
  // no rAF. This is what makes the layer safe to include everywhere.
  if (!cfg.enabled) return inertHandle("theme set --i-3d: none");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  } catch {
    return inertHandle("no webgl context"); // fail soft — decoration must never break a page
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); // 2 is plenty; 3 is battery for nothing

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);

  // ONE InstancedMesh for the whole field. See the header: this is the only kind worth shipping.
  const base = Math.max(0, Math.round((opts.count ?? 140) * cfg.density));
  const geometry = new THREE.IcosahedronGeometry(0.5, 0);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(cfg.form),
    wireframe: true,
    transparent: true,
    opacity: 0.9,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(base, 1));
  mesh.frustumCulled = true;
  scene.add(mesh);

  // Deterministic placement — a decorative field that reshuffles on every reload reads as noise,
  // and a reproducible scene is one you can screenshot-diff.
  const seedRandom = (() => {
    let s = 1337;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  })();

  const spread = 26 * cfg.depth;
  const items = Array.from({ length: base }, () => ({
    x: (seedRandom() - 0.5) * spread,
    y: (seedRandom() - 0.5) * spread * 0.6,
    z: -seedRandom() * spread,
    s: (0.25 + seedRandom() * 0.75) * cfg.scale,
    drift: 0.2 + seedRandom() * 0.8,
  }));

  const dummy = new THREE.Object3D();
  const colorA = new THREE.Color(cfg.accent);
  const colorB = new THREE.Color(cfg.accent2);
  const tmp = new THREE.Color();
  for (let i = 0; i < base; i++) {
    tmp.copy(colorA).lerp(colorB, i / Math.max(base - 1, 1));
    mesh.setColorAt?.(i, tmp);
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = 12 * cfg.depth;
    camera.updateProjectionMatrix();
  }

  function write(t) {
    for (let i = 0; i < base; i++) {
      const it = items[i];
      // motion === 0 is a STILL scene, not a stopped one: the field still exists, it just holds.
      const bob = cfg.motion === 0 ? 0 : Math.sin(t * 0.0003 * it.drift + i) * 0.6 * cfg.motion;
      dummy.position.set(it.x, it.y + bob, it.z);
      dummy.rotation.set(t * 0.00008 * cfg.motion * it.drift, t * 0.0001 * cfg.motion, 0);
      dummy.scale.setScalar(it.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  let raf = 0;
  let running = false;
  function frame(t) {
    write(t);
    renderer.render(scene, camera);
    // A still scene renders once per resize, not 60 times a second for an identical image.
    if (running && cfg.motion > 0) raf = requestAnimationFrame(frame);
  }

  const onResize = () => {
    resize();
    if (!running || cfg.motion === 0) frame(performance.now());
  };

  resize();
  frame(performance.now());
  addEventListener("resize", onResize, { passive: true });

  return {
    ok: true,
    reason: "",
    start() {
      if (running) return;
      running = true;
      if (cfg.motion > 0) raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    /** Re-read the cascade — call after a theme switch. */
    refresh() {
      cfg = readThemeConfig(themeEl);
      material.color.set(cfg.form);
      resize();
      if (!running || cfg.motion === 0) frame(performance.now());
    },
    dispose() {
      this.stop();
      removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      mesh.dispose?.();
      renderer.dispose();
    },
    get info() {
      return {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        instances: base,
        motion: cfg.motion,
      };
    },
  };
}

/**
 * Convenience: make the canvas, mark it inert for assistive tech, insert it, and wire it up.
 * The canvas carries no information, so it is hidden from the accessibility tree by construction
 * rather than by a later audit.
 */
export function mountBackdrop(host, THREE, opts = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = LAYER_CLASS;
  canvas.setAttribute("aria-hidden", "true");
  canvas.tabIndex = -1;
  host.prepend(canvas);
  const handle = createBackdrop(canvas, THREE, opts);
  if (!handle.ok) canvas.remove(); // leave no dead element behind when a theme said no
  return handle;
}
