/**
 * SYSTEM_01 — NEXUS ROBOTICS signature 3D assembly asset
 * =======================================================
 * A procedural, believable robotics platform (competition-rover silhouette:
 * chassis · drivetrain · 2-axis actuator arm · sensor tower · camera gimbal ·
 * PCB · power · control core · comms) built from optimized primitive geometry.
 * No model files, no textures — instant load, tiny footprint.
 *
 * REUSABLE BY DESIGN (not a one-off):
 *   - createSystem01(mount, opts) → controller { setProgress, getArrived, dispose }
 *   - ONE progress scalar (0→1) drives the whole DETECT → ONLINE sequence,
 *     so any page can own the choreography (scroll, click, time).
 *   - SYSTEM01_DEPARTMENTS maps every part id to its department — the
 *     Departments page can later render "MODULE ANALYSIS" views from the
 *     exact same scene (highlight per module).
 *
 * Performance contract:
 *   - ~25 part groups / ~60 low-poly meshes, one InstancedMesh (PCB chips)
 *   - single 1024 shadow map, no post-processing, no bloom
 *   - DPR clamped (1.75 desktop / 1.5 coarse-pointer)
 *   - render loop hard-gated by IntersectionObserver + document.visibilitychange
 *   - full dispose() (geometries, materials, PMREM, renderer, listeners)
 *   - WebGL unavailable → returns null; caller shows the static SVG fallback
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ------------------------------------------------------------------ */
/* public surface                                                      */
/* ------------------------------------------------------------------ */

export type DeptKey = 'mechanical' | 'electronics' | 'embedded' | 'vision' | 'comms';

/** Department → SYSTEM_01 part ids. Departments page reuse ("MODULE ANALYSIS"). */
export const SYSTEM01_DEPARTMENTS: Record<DeptKey, string[]> = {
  mechanical: [
    'm-chassis', 'm-rail-l', 'm-rail-r', 'm-bumper-f', 'm-bumper-r',
    'm-gear-a', 'm-gear-b', 'm-motor-l', 'm-motor-r',
    'm-act-base', 'm-act-elbow', 'm-gripper', 'm-tower',
    'm-wheel-fl', 'm-wheel-fr', 'm-wheel-rl', 'm-wheel-rr',
  ],
  electronics: ['e-pcb', 'e-battery', 'e-wiring'],
  embedded: ['b-control'],
  vision: ['v-camera', 'v-array'],
  comms: ['p-antenna', 'p-comm'],
};

export interface System01Options {
  /** slow hero orbit once the sequence completes (default true) */
  idle?: boolean;
  /** cursor parallax after assembly (default: fine-pointer devices only) */
  parallax?: boolean;
  /** fires after the first rendered frame */
  onReady?: () => void;
}

export interface System01Controller {
  /** drive the DETECT→ONLINE sequence; 0..1 */
  setProgress(p: number): void;
  /** number of parts fully seated at their assembled transform */
  getArrived(): number;
  dispose(): void;
}

/* ------------------------------------------------------------------ */
/* math helpers                                                        */
/* ------------------------------------------------------------------ */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const win01 = (p: number, w0: number, w1: number): number =>
  w1 <= w0 ? (p >= w1 ? 1 : 0) : clamp01((p - w0) / (w1 - w0));
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const rand = (seedRef: { s: number }): number => {
  // deterministic per-part pseudo-random so refreshes look identical
  seedRef.s = (seedRef.s * 16807) % 2147483647;
  return seedRef.s / 2147483647;
};

/* ------------------------------------------------------------------ */
/* part registry                                                       */
/* ------------------------------------------------------------------ */

interface PartSpec {
  id: string;
  module: DeptKey;
  pos: [number, number, number];
  rot?: [number, number, number];
  build: (m: Materials) => THREE.Object3D;
  shadow?: boolean;
  /** custom micro-animation; t = INITIALIZE phase progress 0..1, time = seconds */
  anim?: (t: number, time: number) => void;
}

interface Part extends PartSpec {
  group: THREE.Group;
  assembledPos: THREE.Vector3;
  assembledRot: THREE.Euler;
  scatterPos: THREE.Vector3;
  scatterRot: THREE.Euler;
  spawnPos: THREE.Vector3;
  appear: [number, number];
  arrive: [number, number];
  seed: number;
  arrived: boolean;
}

/* ------------------------------------------------------------------ */
/* materials — restrained, industrial                                  */
/* ------------------------------------------------------------------ */

interface Materials {
  frame: THREE.MeshStandardMaterial;     // anodized dark aluminium
  panel: THREE.MeshStandardMaterial;     // matte black composite
  machined: THREE.MeshStandardMaterial;  // bright machined alu
  pcb: THREE.MeshStandardMaterial;       // dark PCB substrate
  pcbChip: THREE.MeshStandardMaterial;   // black IC packages
  glass: THREE.MeshStandardMaterial;     // dark optical glass
  rubber: THREE.MeshStandardMaterial;    // tires / sleeves
  led: THREE.MeshStandardMaterial;       // cyan indicator (emissive)
  trace: THREE.MeshBasicMaterial;        // cyan pcb trace / lens ring
}

function buildMaterials(): Materials {
  const std = (
    color: number, roughness: number, metalness: number, envInt: number
  ): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    m.envMapIntensity = envInt;
    return m;
  };
  return {
    frame: std(0x1a2028, 0.52, 0.85, 0.5),      // dark machined aluminium
    panel: std(0x10151d, 0.85, 0.15, 0.18),     // matte black composite
    machined: std(0x9aa6b2, 0.3, 1.0, 0.8),     // brushed / turned bright alu
    pcb: std(0x0a231a, 0.6, 0.25, 0.25),        // dark green-black PCB
    pcbChip: std(0x131722, 0.45, 0.4, 0.3),     // IC packages
    glass: std(0x05070a, 0.12, 0.6, 1.0),       // lens glass
    rubber: std(0x0c0e11, 0.95, 0.0, 0.05),     // tires
    led: new THREE.MeshStandardMaterial({
      color: 0x0b1018, emissive: 0x00d9e8, emissiveIntensity: 0,
    }),
    trace: new THREE.MeshBasicMaterial({
      color: 0x00d9e8, transparent: true, opacity: 0.05,
    }),
  };
}

/* ------------------------------------------------------------------ */
/* procedural geometry builders                                        */
/* ------------------------------------------------------------------ */

const box = (w: number, h: number, d: number): THREE.BoxGeometry =>
  new THREE.BoxGeometry(w, h, d);

const cyl = (r: number, l: number, seg = 20): THREE.CylinderGeometry =>
  new THREE.CylinderGeometry(r, r, l, seg);

function gearGeometry(r: number, teeth: number, toothH: number): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i++) {
    const seg = i % 4;
    const a = (i / steps) * Math.PI * 2;
    const rad = seg >= 2 ? r + toothH : r;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, r * 0.3, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: false });
  g.center();
  return g;
}

function wireGeometry(points: THREE.Vector3[]): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 22, 0.016, 6, false);
}

/* ------------------------------------------------------------------ */
/* the parts — an abstract competition platform                        */
/* ------------------------------------------------------------------ */

function partSpecs(): PartSpec[] {
  /* refs captured by micro-animations, populated during build */
  const spin: { wheels: THREE.Group[]; gears: THREE.Mesh[]; camPitch?: THREE.Group } = {
    wheels: [], gears: [],
  };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const ctx: any = { spin };

  const specs: PartSpec[] = [
    /* -------- MECHANICAL · structure -------- */
    {
      id: 'm-chassis', module: 'mechanical', pos: [0, 0.55, 0], shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const plate = new THREE.Mesh(box(3.0, 0.14, 1.9), m.frame);
        g.add(plate);
        const deck = new THREE.Mesh(box(2.2, 0.05, 1.3), m.panel);
        deck.position.set(-0.15, 0.1, 0);
        g.add(deck);
        return g;
      },
    },
    {
      id: 'm-rail-l', module: 'mechanical', pos: [0, 0.55, -0.95],
      build: (m) => new THREE.Mesh(box(3.0, 0.22, 0.1), m.frame),
    },
    {
      id: 'm-rail-r', module: 'mechanical', pos: [0, 0.55, 0.95],
      build: (m) => new THREE.Mesh(box(3.0, 0.22, 0.1), m.frame),
    },
    {
      id: 'm-bumper-f', module: 'mechanical', pos: [1.58, 0.62, 0],
      build: (m) => {
        const g = new THREE.Group();
        const bar = new THREE.Mesh(box(0.14, 0.26, 1.5), m.panel);
        g.add(bar);
        const lip = new THREE.Mesh(box(0.05, 0.08, 1.5), m.machined);
        lip.position.set(0.09, 0.14, 0);
        g.add(lip);
        return g;
      },
    },
    {
      id: 'm-bumper-r', module: 'mechanical', pos: [-1.58, 0.62, 0],
      build: (m) => new THREE.Mesh(box(0.14, 0.26, 1.5), m.panel),
    },

    /* -------- MECHANICAL · drivetrain -------- */
    {
      id: 'm-gear-a', module: 'mechanical', pos: [1.02, 0.8, 1.03],
      build: (m) => {
        const mesh = new THREE.Mesh(gearGeometry(0.32, 12, 0.055), m.machined);
        ctx.spin.gears.push(mesh);
        return mesh;
      },
      anim: (t) => {
        ctx.spin.gears[0].rotation.z = t * 1.15;
      },
    },
    {
      id: 'm-gear-b', module: 'mechanical', pos: [1.5, 0.8, 1.03],
      build: (m) => {
        const mesh = new THREE.Mesh(gearGeometry(0.21, 9, 0.05), m.machined);
        ctx.spin.gears.push(mesh);
        return mesh;
      },
      anim: (t) => {
        ctx.spin.gears[1].rotation.z = -t * 1.15 * (32 / 21);
      },
    },
    {
      id: 'm-motor-l', module: 'mechanical', pos: [-0.72, 0.72, -0.55], shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(cyl(0.14, 0.46, 18), m.frame);
        body.rotation.z = Math.PI / 2;
        g.add(body);
        const cap = new THREE.Mesh(cyl(0.09, 0.08, 14), m.machined);
        cap.rotation.z = Math.PI / 2;
        cap.position.x = 0.26;
        g.add(cap);
        return g;
      },
    },
    {
      id: 'm-motor-r', module: 'mechanical', pos: [-0.72, 0.72, 0.55], shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(cyl(0.14, 0.46, 18), m.frame);
        body.rotation.z = Math.PI / 2;
        g.add(body);
        const cap = new THREE.Mesh(cyl(0.09, 0.08, 14), m.machined);
        cap.rotation.z = Math.PI / 2;
        cap.position.x = 0.26;
        g.add(cap);
        return g;
      },
    },

    /* -------- MECHANICAL · actuator arm -------- */
    {
      id: 'm-act-base', module: 'mechanical', pos: [-0.55, 0.68, 0], rot: [0, 0, 0.85],
      shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const base = new THREE.Mesh(cyl(0.2, 0.16, 18), m.frame);
        g.add(base);
        const arm = new THREE.Mesh(box(1.25, 0.14, 0.18), m.frame);
        arm.position.set(0.55, 0.04, 0);
        g.add(arm);
        const joint = new THREE.Mesh(cyl(0.11, 0.22, 14), m.machined);
        joint.rotation.x = Math.PI / 2;
        joint.position.set(1.15, 0.04, 0);
        g.add(joint);
        return g;
      },
    },
    {
      id: 'm-act-elbow', module: 'mechanical', pos: [0.21, 1.54, 0], rot: [0, 0, -0.55],
      shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const arm = new THREE.Mesh(box(1.0, 0.11, 0.15), m.frame);
        arm.position.set(0.45, 0, 0);
        g.add(arm);
        const piston = new THREE.Mesh(cyl(0.03, 0.55, 8), m.machined);
        piston.rotation.z = Math.PI / 2 + 0.12;
        piston.position.set(0.4, -0.09, 0.09);
        g.add(piston);
        return g;
      },
    },
    {
      id: 'm-gripper', module: 'mechanical', pos: [1.02, 1.05, 0], rot: [0, 0, -0.25],
      build: (m) => {
        const g = new THREE.Group();
        const wrist = new THREE.Mesh(cyl(0.09, 0.12, 14), m.machined);
        wrist.rotation.x = Math.PI / 2;
        g.add(wrist);
        for (const s of [-1, 1]) {
          const finger = new THREE.Mesh(box(0.3, 0.045, 0.05), m.machined);
          finger.position.set(0.2, 0, s * 0.075);
          finger.rotation.y = s * 0.12;
          g.add(finger);
        }
        return g;
      },
    },

    /* -------- MECHANICAL · sensor tower (structure) -------- */
    {
      id: 'm-tower', module: 'mechanical', pos: [-1.3, 1.1, 0], shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const mast = new THREE.Mesh(box(0.1, 0.95, 0.1), m.frame);
        g.add(mast);
        const cross = new THREE.Mesh(box(0.55, 0.05, 0.05), m.frame);
        cross.position.set(0.2, 0.47, 0);
        g.add(cross);
        return g;
      },
    },

    /* -------- MECHANICAL · wheels -------- */
    ...([-1, 1].flatMap((zx) => [-1, 1].map((xx): PartSpec => ({
      id: `m-wheel-${xx < 0 ? 'r' : 'f'}${zx < 0 ? 'l' : 'r'}`,
      module: 'mechanical',
      pos: [xx * 1.28, 0.42, zx * 1.14],
      shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const spinGroup = new THREE.Group();
        const tire = new THREE.Mesh(cyl(0.42, 0.3, 26), m.rubber);
        tire.rotation.x = Math.PI / 2;
        spinGroup.add(tire);
        const hub = new THREE.Mesh(cyl(0.17, 0.32, 16), m.machined);
        hub.rotation.x = Math.PI / 2;
        spinGroup.add(hub);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 8, 26), m.frame);
        spinGroup.add(ring);
        g.add(spinGroup);
        ctx.spin.wheels.push(spinGroup);
        return g;
      },
      anim: (t) => {
        for (const w of ctx.spin.wheels) w.rotation.z = t * 0.5;
      },
    })))),
  ];

  /* -------- ELECTRONICS -------- */
  specs.push(
    {
      id: 'e-pcb', module: 'electronics', pos: [0.25, 0.7, -0.15],
      build: (m) => {
        const g = new THREE.Group();
        const board = new THREE.Mesh(box(1.35, 0.045, 0.95), m.pcb);
        g.add(board);
        /* instanced IC packages — one draw call */
        const chips = new THREE.InstancedMesh(box(0.16, 0.05, 0.16), m.pcbChip, 7);
        const dummy = new THREE.Object3D();
        const spots: [number, number][] = [
          [-0.4, -0.25], [-0.12, -0.28], [0.18, -0.22], [0.42, -0.25],
          [-0.35, 0.2], [0.05, 0.18], [0.4, 0.22],
        ];
        spots.forEach((s, i) => {
          dummy.position.set(s[0], 0.048, s[1]);
          dummy.rotation.y = i % 2 === 0 ? 0 : Math.PI / 2;
          dummy.updateMatrix();
          chips.setMatrixAt(i, dummy.matrix);
        });
        g.add(chips);
        const mcu = new THREE.Mesh(box(0.3, 0.06, 0.3), m.pcbChip);
        mcu.position.set(-0.05, 0.05, -0.02);
        g.add(mcu);
        /* restrained cyan traces — dark until INITIALIZE */
        for (let i = 0; i < 3; i++) {
          const tr = new THREE.Mesh(box(0.5, 0.006, 0.016), m.trace);
          tr.position.set(-0.3 + i * 0.32, 0.028, 0.32 - i * 0.1);
          tr.rotation.y = 0.5 - i * 0.4;
          g.add(tr);
        }
        return g;
      },
    },
    {
      id: 'e-battery', module: 'electronics', pos: [-0.95, 0.77, -0.5], shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const cell = new THREE.Mesh(box(0.7, 0.28, 0.5), m.panel);
        g.add(cell);
        for (const s of [-1, 1]) {
          const strap = new THREE.Mesh(box(0.05, 0.3, 0.52), m.frame);
          strap.position.x = s * 0.16;
          g.add(strap);
        }
        const terminal = new THREE.Mesh(box(0.1, 0.06, 0.1), m.machined);
        terminal.position.set(0.3, 0.16, 0.15);
        g.add(terminal);
        return g;
      },
    },
    {
      id: 'e-wiring', module: 'electronics', pos: [0, 0.62, 0],
      build: (m) => {
        const g = new THREE.Group();
        const w1 = new THREE.Mesh(
          wireGeometry([
            new THREE.Vector3(-0.6, 0.05, -0.42),
            new THREE.Vector3(-0.35, 0.18, -0.35),
            new THREE.Vector3(-0.05, 0.08, -0.25),
          ]),
          m.rubber
        );
        g.add(w1);
        const w2 = new THREE.Mesh(
          wireGeometry([
            new THREE.Vector3(-0.55, 0.05, -0.5),
            new THREE.Vector3(-0.3, 0.22, -0.45),
            new THREE.Vector3(0.1, 0.1, -0.4),
          ]),
          m.rubber
        );
        g.add(w2);
        return g;
      },
    }
  );

  /* -------- EMBEDDED · control core -------- */
  specs.push({
    id: 'b-control', module: 'embedded', pos: [0.95, 0.76, -0.55], shadow: true,
    build: (m) => {
      const g = new THREE.Group();
      const enclosure = new THREE.Mesh(box(0.5, 0.2, 0.42), m.frame);
      g.add(enclosure);
      for (let i = 0; i < 6; i++) {
        const fin = new THREE.Mesh(box(0.018, 0.16, 0.44), m.machined);
        fin.position.set(-0.18 + i * 0.072, 0.03, 0);
        g.add(fin);
      }
      /* status LED — the restrained cyan indicator */
      const led = new THREE.Mesh(box(0.015, 0.03, 0.24), m.led);
      led.position.set(0.255, 0.02, 0);
      g.add(led);
      return g;
    },
  });

  /* -------- VISION -------- */
  specs.push(
    {
      id: 'v-camera', module: 'vision', pos: [-0.78, 1.48, 0], shadow: true,
      build: (m) => {
        const g = new THREE.Group();
        const pitch = new THREE.Group();
        ctx.spin.camPitch = pitch;
        const yoke1 = new THREE.Mesh(box(0.05, 0.16, 0.03), m.frame);
        yoke1.position.set(0, 0, -0.1);
        pitch.add(yoke1);
        const yoke2 = yoke1.clone();
        yoke2.position.z = 0.1;
        pitch.add(yoke2);
        const barrel = new THREE.Mesh(cyl(0.085, 0.24, 18), m.frame);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 0.12;
        pitch.add(barrel);
        const lens = new THREE.Mesh(cyl(0.07, 0.02, 18), m.glass);
        lens.rotation.z = Math.PI / 2;
        lens.position.x = 0.245;
        pitch.add(lens);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.007, 8, 22), m.trace);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = 0.245;
        pitch.add(ring);
        g.add(pitch);
        return g;
      },
      anim: (t, time) => {
        const p = ctx.spin.camPitch as THREE.Group;
        /* levels from a downward stow into scanning position */
        p.rotation.z = 0.24 * (1 - smootherstep(t)) + (t >= 1 ? Math.sin(time * 0.4) * 0.045 : 0);
      },
    },
    {
      id: 'v-array', module: 'vision', pos: [1.62, 0.78, 0],
      build: (m) => {
        const g = new THREE.Group();
        const pod = new THREE.Mesh(box(0.1, 0.1, 0.2), m.panel);
        pod.position.set(0, 0.07, 0.32);
        g.add(pod);
        for (const s of [-1, 1]) {
          const eye = new THREE.Mesh(cyl(0.042, 0.08, 12), m.glass);
          eye.rotation.z = Math.PI / 2;
          eye.position.set(0.05, 0, s * 0.24);
          g.add(eye);
        }
        const emitter = new THREE.Mesh(box(0.015, 0.05, 0.05), m.led);
        emitter.position.set(0.06, 0.07, 0.32);
        g.add(emitter);
        return g;
      },
    }
  );

  /* -------- COMMS / PR -------- */
  specs.push(
    {
      id: 'p-antenna', module: 'comms', pos: [-1.3, 1.85, -0.22],
      build: (m) => {
        const g = new THREE.Group();
        const rod = new THREE.Mesh(cyl(0.012, 0.52, 8), m.machined);
        g.add(rod);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), m.led);
        tip.position.y = 0.27;
        g.add(tip);
        return g;
      },
    },
    {
      id: 'p-comm', module: 'comms', pos: [-1.32, 1.18, -0.5], rot: [-0.6, 0, 0],
      build: (m) => {
        const g = new THREE.Group();
        const plate = new THREE.Mesh(box(0.03, 0.3, 0.42), m.panel);
        g.add(plate);
        const edge = new THREE.Mesh(box(0.012, 0.26, 0.02), m.trace);
        edge.position.set(0.02, 0, 0.18);
        g.add(edge);
        return g;
      },
    }
  );

  return specs;
}

/* ------------------------------------------------------------------ */
/* scene factory                                                       */
/* ------------------------------------------------------------------ */

function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function createSystem01(
  mount: HTMLElement,
  opts: System01Options = {}
): System01Controller | null {
  if (!detectWebGL()) return null;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- renderer / scene / camera ---- */
  const canvas = document.createElement('canvas');
  canvas.className = 's01-canvas';
  mount.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 1.75));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !coarse;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080c);
  scene.fog = new THREE.Fog(0x06080c, 10, 24);

  const camera = new THREE.PerspectiveCamera(
    38, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 60
  );

  /* ---- environment: procedural room, no HDR downloads ---- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  /* ---- cinematic restrained lighting ---- */
  const key = new THREE.DirectionalLight(0xf2f5f8, 2.6);
  key.position.set(4, 7, 3);
  if (!coarse) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0004;
  }
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x00d9e8, 0.5);   // controlled cyan rim
  rim.position.set(-6, 3, -5);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x8fa3b8, 0.32); // cool fill
  fill.position.set(-3, 2, 6);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0x1a2430, 0.55));

  /* ---- floor: shadow catcher + engineered grid ---- */
  const floorGeo = new THREE.PlaneGeometry(40, 40);
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.42 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(26, 52, 0x1b2836, 0x10161f);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.5;
  grid.position.y = 0.001;
  scene.add(grid);

  /* ---- DETECT origin marker: pulsing wireframe volume ---- */
  const originMat = new THREE.LineBasicMaterial({
    color: 0x00d9e8, transparent: true, opacity: 0,
  });
  const originBox = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 1.9, 2.0)),
    originMat
  );
  originBox.position.y = 0.95;
  scene.add(originBox);

  /* ---- parts ---- */
  const materials = buildMaterials();
  const root = new THREE.Group();
  scene.add(root);

  const seedState = { s: 20260815 };
  const moduleCounts: Partial<Record<DeptKey, number>> = {};
  const parts: Part[] = partSpecs().map((spec, i) => {
    const group = new THREE.Group();
    const inner = spec.build(materials);
    group.add(inner);
    /* cast shadows from the chunky meshes only */
    inner.traverse((o) => {
      if (spec.shadow && (o as THREE.Mesh).isMesh) {
        o.castShadow = true;
      }
    });

    const assembledPos = new THREE.Vector3(...spec.pos);
    const assembledRot = new THREE.Euler(...(spec.rot ?? [0, 0, 0]));

    /* deterministic scatter: radial from centre + upward bias */
    const r1 = rand(seedState), r2 = rand(seedState), r3 = rand(seedState);
    const dir = assembledPos.clone();
    if (dir.lengthSq() < 0.01) dir.set(r1 - 0.5, 0.4, r2 - 0.5);
    dir.normalize();
    const dist = 2.2 + r3 * 1.5;
    const scatterPos = assembledPos.clone()
      .add(dir.multiplyScalar(dist))
      .add(new THREE.Vector3((r1 - 0.5) * 0.8, 0.5 + r2 * 1.1, (r3 - 0.5) * 0.8));
    const spawnPos = scatterPos.clone()
      .add(new THREE.Vector3().copy(scatterPos).normalize().multiplyScalar(1.7))
      .add(new THREE.Vector3(0, -1.1, 0));

    const scatterRot = new THREE.Euler(
      (r2 - 0.5) * 2.2, (r1 - 0.5) * 2.2, (r3 - 0.5) * 2.2
    );

    /* choreography windows — mechanical streams first, brains last.
       Non-mechanical modules use their LOCAL index so the whole
       assembly is seated by ~0.77 (inside SYNCHRONIZE), i.e. the
       machine is ~65% seated when chapter 05 opens. Parts only begin
       materializing at 0.16 — strictly inside the schematic crossfade
       (REFERENCE holds the schematic alone, 0.00–0.14). */
    const local = moduleCounts[spec.module] ?? 0;
    moduleCounts[spec.module] = local + 1;
    const order = spec.module === 'mechanical' ? i
      : spec.module === 'electronics' ? 17 + local * 0.5
      : 21 + local * 0.7;
    const appear: [number, number] = [0.16 + order * 0.0095, 0.16 + order * 0.0095 + 0.09];
    const arrive: [number, number] = [0.44 + order * 0.0105, 0.44 + order * 0.0105 + 0.1];

    group.position.copy(spawnPos);
    group.visible = false;
    root.add(group);

    return {
      ...spec, group, assembledPos, assembledRot,
      scatterPos, scatterRot, spawnPos, appear, arrive,
      seed: r1 * 100 + r2, arrived: false,
    };
  });

  /* ---- controller state ---- */
  let progress = 0;
  let arrivedCount = 0;
  let raf = 0;
  let running = true;
  let visible = true;
  let readyFired = false;

  /* pointer parallax — desktop only, gentle */
  const parallaxOn = (opts.parallax ?? !coarse) && !reduced;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointerMove = (e: PointerEvent): void => {
    const r = mount.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
    pointer.ty = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
  };
  if (parallaxOn) mount.addEventListener('pointermove', onPointerMove);

  /* visibility gating — never render offscreen or in a hidden tab */
  const io = new IntersectionObserver(
    (entries) => { visible = entries[0].isIntersecting; },
    { rootMargin: '80px' }
  );
  io.observe(mount);
  const onVis = (): void => { visible = !document.hidden; };
  document.addEventListener('visibilitychange', onVis);

  /* resize */
  const ro = new ResizeObserver(() => {
    const w = mount.clientWidth, h = Math.max(1, mount.clientHeight);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(mount);

  /* scratch vectors (no per-frame allocation) */
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  /* accumulated idle yaw — reversible scrub without rotation snapping */
  let idleYaw = 0;
  let lastTime = 0;

  function updateParts(p: number, time: number): void {
    const syncT = win01(p, 0.62, 0.78);
    const initT = win01(p, 0.78, 0.88);
    const onlineT = win01(p, 0.88, 1.0);
    arrivedCount = 0;

    for (const part of parts) {
      const a = easeOutCubic(win01(p, part.appear[0], part.appear[1]));
      const b = smootherstep(win01(p, part.arrive[0], part.arrive[1]));
      part.arrived = b >= 1;
      if (part.arrived) arrivedCount++;

      part.group.visible = a > 0.002;
      if (!part.group.visible) continue;

      /* two-stage travel: darkness → scatter hold → assembled seat */
      vA.lerpVectors(part.spawnPos, part.scatterPos, a);
      vB.lerpVectors(vA, part.assembledPos, b);
      part.group.position.copy(vB);

      vA.set(
        part.scatterRot.x * (1 - b), part.scatterRot.y * (1 - b), part.scatterRot.z * (1 - b)
      );
      part.group.rotation.set(
        vA.x + part.assembledRot.x * b,
        vA.y + part.assembledRot.y * b,
        vA.z + part.assembledRot.z * b
      );

      /* alignment wobble while waiting at scatter — decays as it seats */
      const wobble = (1 - b) * a;
      if (wobble > 0.001) {
        part.group.rotation.x += Math.sin(time * 0.7 + part.seed) * 0.06 * wobble;
        part.group.rotation.z += Math.cos(time * 0.55 + part.seed * 1.3) * 0.05 * wobble;
      }

      const s = 0.94 + 0.06 * a;
      part.group.scale.setScalar(s);

      if (part.anim) part.anim(initT, time);
    }

    /* DETECT marker — pulses only inside the crossfade window; never
       visible alongside the full-brightness schematic (strict phase
       separation: REFERENCE = schematic alone) */
    const markerFade = win01(p, 0.17, 0.22) * (1 - win01(p, 0.34, 0.40));
    originMat.opacity = markerFade * (0.18 + 0.5 * (0.5 + 0.5 * Math.sin(time * 2.2)));
    originBox.visible = markerFade > 0.001;

    /* system activation — restrained cyan only. LEDs and traces begin
       with SYNCHRONIZE (systems linking), reach full by ONLINE. */
    materials.led.emissiveIntensity = (0.25 * syncT + initT) * 2.3;
    materials.trace.opacity = 0.05 + (0.25 * syncT + 0.75 * smootherstep(initT)) * 0.72;

    /* ONLINE idle: slow deliberate orbit + breath, gated by sequence end */
    const idleOn = (opts.idle ?? true) && !reduced;
    const dt = Math.min(0.05, time - lastTime);
    lastTime = time;
    const idleRate = onlineT * 0.045;
    if (idleOn && idleRate > 0.0001) idleYaw += idleRate * dt;
    root.rotation.y = idleYaw;
    root.position.y = idleOn ? Math.sin(time * 0.85) * 0.012 * onlineT : 0;
    if (parallaxOn && onlineT > 0.5) {
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      root.rotation.x = pointer.y * 0.03 * onlineT;
      root.rotation.y += pointer.x * 0.06 * onlineT;
    } else {
      root.rotation.x *= 0.9;
    }
  }

  /* robot presence track — how visually present the machine is.
     CONTENT-FIRST discipline (brief §3/§6): full presence only at the
     ASSEMBLE payoff (0.42–0.62); content-heavy chapters hold the robot
     in the background at reduced contrast. Returns 0.35–1.0. */
  function presence(p: number): number {
    const detect = win01(p, 0.16, 0.24);            // DETECT emergence
    const buildPayoff = win01(p, 0.42, 0.50) * (1 - win01(p, 0.60, 0.66));
    const online = win01(p, 0.88, 0.93);
    // floor 0.35 while parts exist; boosted to 1 during ASSEMBLE, 0.8 ONLINE
    let v = 0.35 + 0.15 * detect;
    v += 0.5 * buildPayoff;
    v += 0.45 * online;
    return Math.min(1, v);
  }

  function updateCamera(p: number): void {
    /* CONTENT-FIRST COMPOSITION (brief §4): the machine occupies the
       side OPPOSITE the chapter's content block.
       01 REFERENCE  — schematic centre, no physical machine
       02 DETECT     — content LEFT,  machine right-of-centre
       03 ANALYZE    — content LEFT,  machine right
       04 ASSEMBLE   — minimal text, machine centre (payoff)
       05 SYNCHRONIZE— content RIGHT, machine left
       06 ONLINE     — statement LEFT, machine upper-right */
    const drift = smootherstep(win01(p, 0, 0.66));
    const dolly = smootherstep(win01(p, 0.68, 1));
    /* horizontal placement: 0 = machine frame-left, 1 = frame-right */
    const wDetect = win01(p, 0.14, 0.24) * (1 - win01(p, 0.30, 0.38));
    const wAnalyze = win01(p, 0.30, 0.38) * (1 - win01(p, 0.42, 0.50));
    const wAssemble = win01(p, 0.42, 0.50) * (1 - win01(p, 0.60, 0.68));
    const wSync = win01(p, 0.60, 0.68) * (1 - win01(p, 0.86, 0.92));
    const wOnline = win01(p, 0.86, 0.92);
    const place = 0.62 * wDetect + 1.0 * wAnalyze + 0.5 * wAssemble
      + 0.0 * wSync + 0.82 * wOnline;
    const ang = -1.05 + 0.42 * drift + 0.16 * dolly;
    let rad = 8.6 - 1.15 * drift - 1.95 * dolly;
    /* portrait phones: widen the radius so the 3.6-unit-wide platform
       stays in frame (vertical fov is fixed, horizontal shrinks) */
    if (camera.aspect < 1.15) rad *= 1 + (1.15 - camera.aspect) * 0.95;
    const hgt = 2.75 - 0.35 * drift - 0.28 * dolly;
    camera.position.set(Math.sin(ang) * rad, hgt, Math.cos(ang) * rad);
    /* look-at x shifts WITH the content (away from the machine's side):
       place 0 → target +0.55 (machine rides frame-left),
       place 1 → target −0.55 (machine rides frame-right).
       Portrait keeps the machine centred; ONLINE lifts the target so
       the machine clears the bottom text band. */
    const tx = 0.55 - 1.1 * place;
    const portrait = camera.aspect <= 1.05;
    camera.lookAt(
      portrait ? 0 : tx,
      portrait ? 0.82 - 0.34 * dolly : 0.84 + 0.02 * dolly,
      0
    );
  }

  const tick = (now: number): void => {
    raf = requestAnimationFrame(tick);
    if (!running || !visible || document.hidden) return;
    const time = now * 0.001;
    updateParts(progress, time);
    updateCamera(progress);
    /* CONTENT-FIRST presence: the canvas carries only the machine + floor,
       so canvas opacity is the robot's visual weight. Full at the ASSEMBLE
       payoff, held back during content chapters (never fully hidden). */
    canvas.style.opacity = String(presence(progress));
    renderer.render(scene, camera);
    if (!readyFired) {
      readyFired = true;
      opts.onReady?.();
    }
  };
  raf = requestAnimationFrame(tick);

  return {
    setProgress(p: number): void {
      progress = clamp01(p);
    },
    getArrived(): number {
      return arrivedCount;
    },
    dispose(): void {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      if (parallaxOn) mount.removeEventListener('pointermove', onPointerMove);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
        }
      });
      for (const m of Object.values(materials)) m.dispose();
      originMat.dispose();
      floorMat.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (canvas.parentElement === mount) mount.removeChild(canvas);
    },
  };
}
