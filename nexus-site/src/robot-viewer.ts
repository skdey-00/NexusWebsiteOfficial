/**
 * 3D Robot Explode Viewer
 *
 * Loads a .glb model, auto-fits the camera, logs every mesh name for
 * verification, and drives an explode/assemble animation via both
 * GSAP ScrollTrigger (scroll) and a click-toggle button.
 *
 * Visual style matches the site theme: dark bg, red accent, HUD overlay.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ---------- types ----------

interface PartData {
  mesh: THREE.Mesh;
  originalPos: THREE.Vector3;   // local-space position at load
  explodedPos: THREE.Vector3;   // computed local-space target when fully exploded
  label: HTMLDivElement | null;
  worldCenter: THREE.Vector3;   // for label projection
}

// ---------- main entry ----------

export function initRobotViewer(): void {
  const canvas = document.getElementById('robot-3d-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('[Robot Viewer] Canvas element not found');
    return;
  }

  const container = canvas.parentElement as HTMLElement;
  if (!container) {
    console.error('[Robot Viewer] Container not found');
    return;
  }

  // Debug: Log canvas and container info
  console.log('%c[Robot Viewer] Initializing...', 'color:#06D6E5;font-weight:bold');
  console.log('[Robot Viewer] Canvas:', canvas);
  console.log('[Robot Viewer] Container:', container);
  console.log('[Robot Viewer] Canvas size:', { width: canvas.width, height: canvas.height });
  console.log('[Robot Viewer] Container size:', { width: container.clientWidth, height: container.clientHeight });
  const loadingBar = document.getElementById('robot-loading-bar');
  const loadingPct = document.getElementById('robot-loading-pct');
  const loadingOverlay = document.getElementById('robot-loading-overlay');
  const toggleBtn = document.getElementById('robot-toggle-btn');
  const partCountEl = document.getElementById('robot-part-count');
  const statusEl = document.getElementById('robot-status');
  const errorOverlay = document.getElementById('robot-error-overlay');
  const errorText = document.getElementById('robot-error-text');

  // Debug: Log container size
  console.log('%c[Robot Viewer] Container size:', 'color:#06D6E5;font-weight:bold', {
    width: container.clientWidth,
    height: container.clientHeight,
    offsetWidth: container.offsetWidth,
    offsetHeight: container.offsetHeight
  });

  // ---- scene ----
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 5000);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Debug: Log renderer size
  console.log('%c[Robot Viewer] Renderer initialized:', 'color:#06D6E5;font-weight:bold', {
    containerSize: { width: container.clientWidth, height: container.clientHeight },
    rendererSize: renderer.getSize(new THREE.Vector2()),
    canvasSize: { width: canvas.width, height: canvas.height }
  });

  // Force a minimum canvas size if needed
  if (canvas.width === 0 || canvas.height === 0) {
    console.warn('%c[Robot Viewer] Canvas has zero size! Forcing size update...', 'color:#FF9F1C;font-weight:bold');
    const fallbackWidth = Math.max(container.clientWidth, 800);
    const fallbackHeight = Math.max(container.clientHeight, 600);
    renderer.setSize(fallbackWidth, fallbackHeight);
    console.log('%c[Robot Viewer] Canvas size after update:', 'color:#06D6E5;font-weight:bold', {
      width: canvas.width,
      height: canvas.height
    });
  }

  // Ensure canvas is visible
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  // ---- lights ----
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.6);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(5, 8, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xdc2626, 0.8); // red rim — site accent
  rim.position.set(-6, 2, -4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
  fill.position.set(0, -4, 3);
  scene.add(fill);

  // ---- controls ----
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;
  controls.minDistance = 0.5;
  controls.maxDistance = 2000;  // generous — auto-fit may push far out for large models

  // ---- ground grid (subtle) ----
  const grid = new THREE.GridHelper(40, 40, 0x333333, 0x1a1a1a);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.15;
  grid.position.y = -0.01; // will be repositioned after model loads
  scene.add(grid);

  // ---- state ----
  const parts: PartData[] = [];
  let currentProgress = 0;   // smoothed value actually applied to meshes
  let targetProgress = 0;    // set by scroll or toggle
  let modelLoaded = false;
  let modelCenter = new THREE.Vector3();

  // ---- load model ----
  // Draco decoder served locally from public/draco/ — no runtime dependency
  // on Google's CDN (which fails as "Failed to fetch" when blocked/offline/flaky).
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderConfig({ type: 'js' }); // single-threaded decoder, no separate wasm fetch
  dracoLoader.setDecoderPath('/draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  const MODEL_URL = '/models/r3.glb';

  console.log('%c[Robot Viewer] Loading model from:', 'color:#06D6E5;font-weight:bold', MODEL_URL);
  console.time('[Robot Viewer] Model load time');

  // Debug: Check if model URL is accessible
  fetch(MODEL_URL, { method: 'HEAD' })
    .then(response => {
      console.log('%c[Robot Viewer] Model URL accessibility check:', 'color:#06D6E5;font-weight:bold', {
        url: MODEL_URL,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });
    })
    .catch(error => {
      console.error('%c[Robot Viewer] Model URL accessibility check failed:', 'color:#FF9F1C;font-weight:bold', error);
    });

  // Add a timeout to show a warning if model takes too long
  setTimeout(() => {
    if (!modelLoaded && loadingOverlay) {
      console.warn('%c[Robot Viewer] Model taking longer than expected to load...', 'color:#FF9F1C;font-weight:bold');
      if (statusEl) statusEl.textContent = 'LOADING...';
    }
  }, 10000); // 10 seconds

  loader.load(
    MODEL_URL,
    (gltf) => {
      try {
        console.timeEnd('[Robot Viewer] Model load time');
        const model = gltf.scene;
        scene.add(model);

        // ---- walk scene graph, log every mesh ----
        console.log('%c[Robot Viewer] === SCENE GRAPH MESH INVENTORY ===', 'color:#06D6E5;font-weight:bold');
        const genericNames: string[] = [];
        let meshIndex = 0;

        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const name = child.name || '(unnamed)';
          console.log(
            `%c  [${meshIndex}]%c name="${name}"  vertices=${child.geometry?.attributes?.position?.count ?? '?'}  parent="${child.parent?.name ?? 'root'}"`,
            'color:#06D6E5',
            'color:inherit'
          );

          // flag generic / unmeaningful names
          if (isGenericName(name)) {
            genericNames.push(`[${meshIndex}] "${name}"`);
          }
          meshIndex++;
        });
        console.log(`%c[Robot Viewer] Total meshes: ${meshIndex}`, 'color:#06D6E5;font-weight:bold');

        if (genericNames.length > 0) {
          console.warn(
            `%c[Robot Viewer] ⚠ ${genericNames.length} mesh(es) have GENERIC names (not meaningful part names):\n  ${genericNames.join('\n  ')}\n  These came through without descriptive names from the SolidWorks → FreeCAD → Blender pipeline.\n  Consider re-naming objects in Blender before re-exporting the GLB.`,
            'color:#FF9F1C;font-weight:bold'
          );
          if (errorText && errorOverlay) {
            errorText.innerHTML = `<strong>Warning:</strong> ${genericNames.length} of ${meshIndex} parts have generic names (e.g. Object001, mesh_0) instead of meaningful part names. Check the browser console for details. Labels will still work but may be unhelpful.`;
            errorOverlay.style.display = 'flex';
          }
        }

        // ---- compute overall bounding box + center ----
        const box = new THREE.Box3().setFromObject(model);
        const sphere = new THREE.Sphere();
        box.getCenter(modelCenter);
        box.getBoundingSphere(sphere);
        console.log('%c[Robot Viewer] Bounding box:', 'color:#06D6E5', {
          min: box.min.toArray(),
          max: box.max.toArray(),
          size: box.getSize(new THREE.Vector3()).toArray(),
          center: modelCenter.toArray(),
          radius: sphere.radius,
        });

        // reposition grid beneath model
        grid.position.y = box.min.y - 0.02;

        // ---- auto-fit camera ----
        autoFitCamera(camera, controls, sphere, container);

        // ---- build explode data per mesh ----
        buildExplodeData(model, modelCenter, box);

        // ---- hide loading overlay ----
        if (loadingOverlay) {
          gsap.to(loadingOverlay, {
            opacity: 0,
            duration: 0.6,
            onComplete: () => { loadingOverlay.style.display = 'none'; },
          });
        }

        if (partCountEl) partCountEl.textContent = String(parts.length);
        if (statusEl) statusEl.textContent = 'ASSEMBLED';

        modelLoaded = true;
        ScrollTrigger.refresh();
        console.log('%c[Robot Viewer] ✅ Model loaded and displayed successfully.', 'color:#39FF88;font-weight:bold');

        // Debug: Check if model is actually visible
        setTimeout(() => {
          const modelWorldPos = new THREE.Vector3();
          model.getWorldPosition(modelWorldPos);
          const distance = camera.position.distanceTo(modelWorldPos);
          console.log('%c[Robot Viewer] Visibility check:', 'color:#06D6E5;font-weight:bold', {
            modelPosition: modelWorldPos.toArray(),
            cameraPosition: camera.position.toArray(),
            distance: distance,
            cameraNear: camera.near,
            cameraFar: camera.far,
            partsCount: parts.length
          });
        }, 1000);
      } catch (e) {
        console.error('[Robot Viewer] Exception in onLoad:', e);
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (errorText && errorOverlay) {
          const detail = e instanceof Error ? e.message + '\n' + e.stack : String(e);
          errorText.innerHTML = `<strong>Runtime error after load:</strong><br><pre style="white-space:pre-wrap;font-size:11px">${detail}</pre>`;
          errorOverlay.style.display = 'flex';
        }
      }
    },
    (event) => {
      // loading progress
      if (event.lengthComputable && loadingBar && loadingPct) {
        const pct = Math.round((event.loaded / event.total) * 100);
        loadingBar.style.width = `${pct}%`;
        loadingPct.textContent = `${pct}%`;
      }
    },
    (err) => {
      console.error('[Robot Viewer] Failed to load model:', err);
      console.timeEnd('[Robot Viewer] Model load time');
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (errorText && errorOverlay) {
        const detail = err instanceof Error ? err.message : String(err);
        errorText.innerHTML = `<strong>Error:</strong> Could not load the 3D model.<br>URL: ${MODEL_URL}<br>Detail: ${detail}`;
        errorOverlay.style.display = 'flex';
      }
    }
  );

  // ---- explode data builder ----
  function buildExplodeData(
    model: THREE.Object3D,
    center: THREE.Vector3,
    overallBox: THREE.Box3
  ): void {
    // Use a factor relative to model size so explode distance scales naturally
    const modelSize = overallBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
    const EXPLODE_FACTOR = maxDim * 0.8; // parts move up to 80% of model size outward

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      // Original local position
      const originalPos = child.position.clone();

      // This mesh's bounding box center in world space
      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = meshBox.getCenter(new THREE.Vector3());

      // Radial direction from overall model center → this part's center (world)
      const dir = meshCenter.clone().sub(center);
      if (dir.lengthSq() < 1e-8) {
        // part is at dead center — push it straight up
        dir.set(0, 1, 0);
      }
      dir.normalize();

      // Exploded world position
      const explodedWorld = meshCenter.clone().add(dir.multiplyScalar(EXPLODE_FACTOR));

      // Convert world → local for setting mesh.position
      const parent = child.parent;
      const explodedLocal = parent
        ? parent.worldToLocal(explodedWorld.clone())
        : explodedWorld.clone();

      // Labels disabled for now — re-enable later when part names are verified
      parts.push({
        mesh: child,
        originalPos,
        explodedPos: explodedLocal,
        label: null,
        worldCenter: meshCenter,
      });
    });

    console.log(`%c[Robot Viewer] Built explode data for ${parts.length} parts.`, 'color:#06D6E5;font-weight:bold');
  }

  // ---- scroll trigger ----
  ScrollTrigger.create({
    trigger: '#robot-3d-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      // scroll drives target progress
      targetProgress = self.progress;
      updateToggleLabel();
    },
  });

  // ---- toggle button ----
  let toggleState: 'assembled' | 'exploded' = 'assembled';

  function updateToggleLabel(): void {
    if (!toggleBtn) return;
    const newState = targetProgress > 0.5 ? 'exploded' : 'assembled';
    if (newState !== toggleState) {
      toggleState = newState;
      toggleBtn.textContent = toggleState === 'assembled' ? 'EXPLODE' : 'ASSEMBLE';
      toggleBtn.classList.toggle('is-exploded', toggleState === 'exploded');
      if (statusEl) statusEl.textContent = toggleState === 'assembled' ? 'ASSEMBLED' : 'EXPLODED';
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const section = document.getElementById('robot-3d-section');
      if (!section) return;

      // Route through Lenis when available (shared smooth-scroll instance),
      // fall back to the native smooth scroll otherwise.
      import('./main').then(({ lenis }) => {
        if (toggleState === 'assembled') {
          // smooth-scroll to the end of the section to drive the explode via scroll
          const target = section.offsetTop + section.offsetHeight - window.innerHeight;
          if (lenis) lenis.scrollTo(target); else window.scrollTo({ top: target, behavior: 'smooth' });
        } else {
          // scroll back to the section top
          const top = section.offsetTop;
          if (lenis) lenis.scrollTo(top); else window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ---- resize ----
  function onResize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', () => {
    onResize();
    ScrollTrigger.refresh();
  });

  // ---- render loop ----
  const _v = new THREE.Vector3(); // scratch for label projection

  function animate(): void {
    requestAnimationFrame(animate);
    controls.update();

    // smooth progress
    currentProgress += (targetProgress - currentProgress) * 0.08;

    if (modelLoaded && parts.length > 0) {
      for (const p of parts) {
        // lerp position
        p.mesh.position.lerpVectors(p.originalPos, p.explodedPos, currentProgress);

        // update label
        if (p.label) {
          if (currentProgress > 0.25) {
            // get current world center of this mesh (approx — use stored + current offset)
            _v.copy(p.worldCenter);
            // adjust for movement applied to the mesh
            _v.add(
              new THREE.Vector3().subVectors(p.mesh.position, p.originalPos)
                .applyMatrix4(p.mesh.matrixWorld.clone().invert().multiply(p.mesh.matrixWorld))
            );
            // simpler: just project the mesh's current world position
            p.mesh.getWorldPosition(_v);
            _v.project(camera);

            const x = (_v.x * 0.5 + 0.5) * container.clientWidth;
            const y = (-_v.y * 0.5 + 0.5) * container.clientHeight;
            p.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
            p.label.style.opacity = String(
              Math.min(1, (currentProgress - 0.25) / 0.25)
            );
          } else {
            p.label.style.opacity = '0';
          }
        }
      }
    }

    renderer.render(scene, camera);
  }
  animate();
}

// ---------- helpers ----------

function autoFitCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  sphere: THREE.Sphere,
  container: HTMLElement
): void {
  const fov = (camera.fov * Math.PI) / 180;
  const aspect = container.clientWidth / container.clientHeight;

  // Correct sphere-fit: distance = radius / sin(half-fov)
  // (tan-based formula underestimates and clips the model)
  const halfFov = fov / 2;
  const distH = sphere.radius / Math.sin(halfFov);
  const distV = sphere.radius / (Math.sin(halfFov) * aspect);
  const dist = Math.max(distH, distV) * 1.6; // 60% margin for comfortable framing

  const center = sphere.center.clone();

  // position camera at a 3/4 view (slightly above, to the right, in front)
  const offset = new THREE.Vector3(dist * 0.5, dist * 0.4, dist * 0.75);
  camera.position.copy(center.clone().add(offset));
  camera.near = Math.max(0.001, dist / 1000);
  camera.far = dist * 1000;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();

  console.log('%c[Robot Viewer] Camera auto-fit:', 'color:#06D6E5', {
    position: camera.position.toArray(),
    target: center.toArray(),
    distance: dist,
    radius: sphere.radius,
    near: camera.near,
    far: camera.far,
  });
}

/**
 * Detect generic / unmeaningful mesh names that likely came through
 * the export pipeline without proper naming.
 */
function isGenericName(name: string): boolean {
  if (!name || name === '(unnamed)') return true;
  const lower = name.toLowerCase();
  // Blender default primitives
  if (/^(cube|plane|cylinder|sphere|cone|torus|ico\s*sphere|grid|monkey|text)$/.test(lower)) return true;
  // Object followed by digits (Blender auto-name)
  if (/^object_?\d+/i.test(name)) return true;
  // mesh_ followed by digits
  if (/^mesh_?\d+/i.test(name)) return true;
  // Empty / null / default
  if (/^(empty|null|default|untitled)/i.test(name)) return true;
  return false;
}
