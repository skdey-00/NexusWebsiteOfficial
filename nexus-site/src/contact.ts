/**
 * COMMUNICATIONS TERMINAL — contact page experience.
 *
 *   signal field  faint node/edge mesh behind the content (desktop only,
 *                 slow drifting nodes + occasional pulse travelling an edge)
 *   entrances     restrained fade/translate reveals for hero / board / rows
 *
 * Requires #ct-root; safe no-op otherwise. Motion self-gates on
 * prefers-reduced-motion (render still happens, canvas pauses).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* SIGNAL FIELD — the communications infrastructure behind the UI      */
/* ------------------------------------------------------------------ */

interface SigNode { x: number; y: number; vx: number; vy: number; }
interface SigPulse { a: number; b: number; t: number; }

function initSignalField(): void {
  const canvas = document.getElementById('ct-signal') as HTMLCanvasElement | null;
  if (!canvas) return;
  if (window.matchMedia('(max-width: 760px)').matches) return;   // simplified away on mobile
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const CYAN = '6, 214, 229';
  let w = 0;
  let h = 0;
  let raf = 0;
  let nodes: SigNode[] = [];
  let pulses: SigPulse[] = [];
  let lastPulse = 0;

  const resize = (): void => {
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * devicePixelRatio);
    canvas.height = Math.round(h * devicePixelRatio);
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    const count = Math.min(26, Math.max(14, Math.round((w * h) / 90000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
    }));
    pulses = [];
  };

  const LINK = 170;

  const step = (now: number): void => {
    ctx.clearRect(0, 0, w, h);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;
    }

    // edges
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d > LINK) continue;
        const a = 0.05 * (1 - d / LINK);
        ctx.strokeStyle = `rgba(${CYAN}, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }

    // nodes
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${CYAN}, 0.22)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // spawn a pulse occasionally
    if (now - lastPulse > 2600 && nodes.length > 1) {
      lastPulse = now;
      const a = Math.floor(Math.random() * nodes.length);
      let b = Math.floor(Math.random() * nodes.length);
      if (b === a) b = (b + 1) % nodes.length;
      pulses.push({ a, b, t: 0 });
    }

    // pulses travelling along edges
    pulses = pulses.filter((p) => p.t <= 1);
    for (const p of pulses) {
      p.t += 0.012;
      const A = nodes[p.a];
      const B = nodes[p.b];
      if (!A || !B) continue;
      const x = A.x + (B.x - A.x) * p.t;
      const y = A.y + (B.y - A.y) * p.t;
      ctx.fillStyle = `rgba(${CYAN}, ${(0.5 * (1 - p.t)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  };

  resize();
  window.addEventListener('resize', resize);

  if (reduced()) {
    // static single paint — infrastructure present, nothing moves
    step(0);
    cancelAnimationFrame(raf);
    return;
  }
  raf = requestAnimationFrame(step);
}

/* ------------------------------------------------------------------ */
/* ENTRANCES — restrained, content-first                               */
/* ------------------------------------------------------------------ */

function initEntrances(): void {
  if (reduced()) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.ct-hero-kicker, .ct-hero-meta', { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 })
    .from('.ct-hero-title', { opacity: 0, y: 34, duration: 1.0 }, '-=0.35')
    .from('.ct-hero-copy', { opacity: 0, y: 18, duration: 0.8 }, '-=0.55');

  gsap.from('.ct-board', {
    scrollTrigger: { trigger: '.ct-board', start: 'top 82%', toggleActions: 'play none none none' },
    opacity: 0,
    y: 36,
    duration: 1.0,
    ease: 'power3.out',
  });

  gsap.from('.ct-node', {
    scrollTrigger: { trigger: '.ct-nodes', start: 'top 80%', toggleActions: 'play none none none' },
    opacity: 0,
    x: -18,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power3.out',
  });

  gsap.from('.ct-uplink-row', {
    scrollTrigger: { trigger: '.ct-uplinks', start: 'top 85%', toggleActions: 'play none none none' },
    opacity: 0,
    y: 16,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power3.out',
  });
}

/* ------------------------------------------------------------------ */

export function initContact(): void {
  if (!document.getElementById('ct-root')) return;
  initSignalField();
  initEntrances();
}
