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
  // Pixel ratio is owned by resize(), which runs before the first frame and again on every change.
  // One owner: a second setPixelRatio here would be the copy that stops matching.

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);

  // ONE InstancedMesh for the whole field. See the header: this is the only kind worth shipping.
  const base = Math.max(0, Math.round((opts.count ?? 140) * cfg.density));
  const geometry = new THREE.IcosahedronGeometry(0.5, 0);
  /**
   * WHITE IS THE IDENTITY ELEMENT, AND THAT IS THE WHOLE POINT.
   *
   * InstancedMesh MULTIPLIES each instance's colour by the material's. Setting the material to one
   * theme token and the instances to another multiplies two theme colours together, and a product
   * of two colours can only ever be darker than either — so a light theme could not produce a light
   * scene no matter what its tokens said.
   *
   * Measured across this repo's own themes before the fix, decoration against its own page:
   * swiss 3.62, blueprint 3.24, editorial 2.75 — all three light themes rendered at or near TEXT
   * contrast, far too loud for something sitting behind content — while bento, the dark one, came
   * out at 2.47 and nearly vanished. Wrong in both directions, from one multiply.
   *
   * So the material is the identity colour and every theme colour is carried by the instance
   * colours in paint(). Rule 16 of `npm run check` holds this line.
   */
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
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

  /**
   * How far the accent gradient pulls the field away from the theme's structural line colour.
   * Not a magic number: at 0 the field is exactly `--i-3d-form` and a theme's accents never appear;
   * at 1 the structural colour has no say at all. 0.6 keeps the accents legible as the theme's
   * identity while the wireframe still reads as the same family as the 2D rules it sits behind.
   */
  const ACCENT_PULL = 0.6;

  const colorForm = new THREE.Color();
  const colorA = new THREE.Color();
  const colorB = new THREE.Color();
  const grad = new THREE.Color();
  const out = new THREE.Color();

  /**
   * Recompute every instance colour from the CURRENT cascade — on create, and again on refresh()
   * after a theme switch. Colour lives here and nowhere else (see the material above).
   *
   * A token carrying alpha (`rgba(…, .13)`) loses it at this boundary: THREE.Color is RGB only.
   * That is why the mix below, rather than a token's own transparency, decides how present the
   * field is — a theme that expressed subtlety through alpha would otherwise be ignored silently.
   */
  function paint() {
    colorForm.set(cfg.form);
    colorA.set(cfg.accent);
    colorB.set(cfg.accent2);
    for (let i = 0; i < base; i++) {
      grad.copy(colorA).lerp(colorB, i / Math.max(base - 1, 1));
      out.copy(colorForm).lerp(grad, ACCENT_PULL);
      mesh.setColorAt?.(i, out);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  paint();

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    // Re-read the pixel ratio EVERY resize rather than once at create. A window dragged to a
    // different-DPI monitor, or a browser zoom, changes it; reading it once left the buffer over-
    // or under-sampled for the rest of the session. Over-sampled is precisely the "battery for
    // nothing" the cap below exists to prevent, so it must not arrive through the back door.
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
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
  // `running` is what the CALLER asked for, deliberately separate from what the theme allows. Two
  // different questions: a caller can want animation while a theme has switched the layer off, and
  // collapsing them into one flag is how a theme switch silently became permanent.
  let running = false;
  const loopWanted = () => running && cfg.enabled && cfg.motion > 0;
  function frame(t) {
    if (!cfg.enabled) return; // `none` means none at every moment, not only at create time
    write(t);
    renderer.render(scene, camera);
    // A still scene renders once per resize, not 60 times a second for an identical image.
    if (loopWanted()) raf = requestAnimationFrame(frame);
  }

  const onResize = () => {
    resize();
    if (!running || cfg.motion === 0) frame(performance.now());
  };

  resize();
  frame(performance.now());

  // TWO triggers, because they catch different things. `resize` fires for a window or DPI change
  // that can leave the element the same CSS size; ResizeObserver fires for a layout change — a
  // sidebar collapsing, a panel opening — that never touches the window at all. Watching only the
  // window stretched a stale buffer across the canvas whenever its host changed shape on its own.
  // No feedback loop: setSize(w, h, false) writes the drawing buffer and never the CSS box.
  addEventListener("resize", onResize, { passive: true });
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(onResize) : null;
  observer?.observe(canvas);

  return {
    ok: true,
    reason: "",
    start() {
      running = true;
      cancelAnimationFrame(raf); // never two loops, whatever order start/refresh arrive in
      if (loopWanted()) raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    /**
     * Re-read the cascade — call after a theme switch.
     *
     * A THEME MAY SWITCH THE LAYER OFF AFTER MOUNT, and until this handled that, `--i-3d: none` was
     * honoured only at create time: loading under Swiss and switching to Terminal left the scene
     * rendering behind a theme whose entire claim is that it deletes such things. The layer's
     * headline promise cannot be true only at first paint.
     *
     * Off means hidden and not rendering, not disposed: the caller may switch back, and a handle
     * that destroyed its own renderer could not honour that. The cost is a retained WebGL context
     * while a `none` theme is active — real, and the reason to prefer not mounting at all when the
     * theme is known up front, which is exactly what the consumer's cheap-module-first check does.
     */
    refresh() {
      cfg = readThemeConfig(themeEl);
      cancelAnimationFrame(raf);
      canvas.style.display = cfg.enabled ? "" : "none";
      if (!cfg.enabled) return;
      paint();
      resize();
      if (loopWanted()) raf = requestAnimationFrame(frame);
      else frame(performance.now());
    },
    dispose() {
      this.stop();
      removeEventListener("resize", onResize);
      observer?.disconnect();
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
