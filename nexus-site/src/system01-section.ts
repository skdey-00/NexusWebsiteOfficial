/**
 * SYSTEM_01 / ASSEMBLY — homepage scroll choreography (chapter 03)
 * CONTENT FIRST · ROBOT SECOND · UI THIRD
 *
 * ARCHITECTURE — ONE SCROLL OWNER, ONE SOURCE OF TRUTH:
 *   initSystem01Section() synchronously creates THE master ScrollTrigger
 *   (pins #s01-stage, viewport-derived distance). Its scrubbed progress
 *   is smoothed once (gsap.quickTo proxy) and fed to a single pure
 *   function, renderSystem01(progress). EVERYTHING editorial is DERIVED
 *   from that scalar inside render — chapter crossfades, schematic,
 *   background word, link arming, HUD ownership, counter, and the lazy
 *   Three.js engine. There are NO per-chapter GSAP tweens and no second
 *   ScrollTrigger positioning or animating SYSTEM_01 (the engine loader
 *   is a once-only onEnter that never pins).
 *
 * Chapter crossfades are OVERLAPPING, derived from progress:
 *   around each phase boundary the outgoing chapter eases 1→0 while the
 *   incoming chapter eases 0→1 over the SAME window (≈22% of the
 *   distance between chapter centres). At the window centre both sit at
 *   exactly 50% — there is never a blank/weak-text interval.
 *
 * Chapter map (progress 0 → 1):
 *   0.00-0.14  01 REFERENCE   schematic only, concept copy (no machine)
 *   0.14-0.30  02 DETECT      schematic crossfades out, first parts
 *   0.30-0.42  03 ANALYZE     copy left, machine right, robot dimmed
 *   0.42-0.62  04 ASSEMBLE    payoff — machine centre, full presence
 *   0.62-0.86  05 SYNCHRONIZE copy right, machine left, links arm
 *   0.86-1.00  06 ONLINE      resolution — HOLDS visible through pin
 *                              release; the stage carries its final
 *                              statement out while THE COLLECTIVE enters
 *                              (no fade-to-empty, no dead scroll band).
 *
 * Pin distance is viewport-derived (≈1.8 vh fine-pointer / 1.6 vh touch)
 * and the six phases occupy the full 0→1 range: the last part seats at
 * p≈0.77, LED/trace INITIALIZE runs 0.78–0.88, the ONLINE camera dolly
 * resolves to exactly 1.0, and the pin releases on the final beat.
 *
 * Diagnostics: append ?s01debug to the URL for [SYSTEM_01 DEBUG] and
 * [COLLECTIVE DEBUG] geometry logs (start/end/pin distance/spacer).
 *
 * Fallbacks: no WebGL / engine failure → kill trigger, static schematic
 * composition. prefers-reduced-motion → same static composition, and no
 * pin or trigger is ever created.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import anime from 'animejs';

gsap.registerPlugin(ScrollTrigger);

const CHAPTERS = [
  { at: 0.0, name: 'REFERENCE' },
  { at: 0.14, name: 'DETECT' },
  { at: 0.30, name: 'ANALYZE' },
  { at: 0.42, name: 'ASSEMBLE' },
  { at: 0.62, name: 'SYNCHRONIZE' },
  { at: 0.86, name: 'ONLINE' },
];

const STATUS: Record<string, string> = {
  REFERENCE: 'SCANNING',
  DETECT: 'DETECTING',
  ANALYZE: 'ANALYZING',
  ASSEMBLE: 'ASSEMBLING',
  SYNCHRONIZE: 'LINKING',
  ONLINE: 'ONLINE',
};

/** phase-boundary crossfade windows, derived once from CHAPTER centres */
const BOUNDARIES = CHAPTERS.slice(1).map((c) => c.at);
const windowFor = (b: number): number => {
  const i = BOUNDARIES.indexOf(b);
  const prev = i > 0 ? BOUNDARIES[i - 1] : 0;
  const next = i < BOUNDARIES.length - 1 ? BOUNDARIES[i + 1] : 1;
  const span = Math.min(b - prev, next - b);
  return Math.min(0.045, Math.max(0.018, 0.22 * span));
};

const smoothstep = (t: number): number => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** eased 0→1 across [b - w/2, b + w/2] — the shared crossfade curve */
const cross = (p: number, b: number, w: number): number =>
  smoothstep((p - (b - w / 2)) / w);

/** piecewise-linear keyframe track with value holds outside the range */
const track = (
  p: number,
  keys: ReadonlyArray<readonly [number, number]>
): number => {
  if (p <= keys[0][0]) return keys[0][1];
  for (let k = 1; k < keys.length; k++) {
    if (p <= keys[k][0]) {
      const [t0, v0] = keys[k - 1];
      const [t1, v1] = keys[k];
      const t = (p - t0) / Math.max(1e-6, t1 - t0);
      return v0 + (v1 - v0) * t;
    }
  }
  return keys[keys.length - 1][1];
};

/** The lazy Three.js engine surface (system01.ts) this section drives. */
interface EngineController {
  setProgress(p: number): void;
  getArrived(): number;
  dispose(): void;
}

const q = (s: string, ctx: ParentNode = document): HTMLElement | null =>
  ctx.querySelector<HTMLElement>(s);

export function initSystem01Section(): void {
  const stageEl = q('#s01-stage');
  if (!stageEl) return;
  const stage = stageEl;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const statusVal = q('#hp-hud-status-word');
  const hudSub = q('#hp-hud-sub');
  const chNumEl = q('#s01-ch-num', stage);
  const railItems = Array.from(
    stage.querySelectorAll<HTMLElement>('[data-rail]')
  );

  const setChapterNum = (n: number): void => {
    if (chNumEl) chNumEl.textContent = String(n).padStart(2, '0');
    railItems.forEach((el, i) => {
      el.classList.toggle('is-active', i === n - 1);
      el.classList.toggle('is-past', i < n - 1);
    });
  };

  /* the assembly borrows the global HUD's status word + sub line while
     pinned; home.ts installs these two setters on window */
  const hudSet = (window as unknown as {
    hpHudSetStatus?: (w: string, s: string) => void;
    hpHudReleaseStatus?: () => void;
  });
  const pushStatus = (word: string, sub: string): void => {
    hudSet.hpHudSetStatus?.(word, sub);
    if (hudSub) hudSub.textContent = sub;
  };

  /* dev-flag diagnostics (?s01debug) — zero cost when off */
  const DEBUG = typeof location !== 'undefined' &&
    new URLSearchParams(location.search).has('s01debug');

  const mountFallback = (): void => {
    stage.classList.add('is-static');
    const schem = q('.s01-schematic', stage);
    if (schem) schem.hidden = false;
    const mount = q('.s01-mount', stage);
    if (mount) mount.hidden = true;
    setChapterNum(6);
    const onlineCh = q('.s01-ch--online', stage);
    if (onlineCh) onlineCh.classList.add('is-shown');
  };

  if (reduced) {
    mountFallback();
    return;
  }

  /* ============== HUD chapter state (DOM-only, engine-independent) === */
  let lastCh = -1;
  let hudReleased = false;
  const applyChapter = (idx: number): void => {
    if (idx === lastCh || hudReleased) return;
    lastCh = idx;
    setChapterNum(idx + 1);
    const name = CHAPTERS[idx].name;
    const word = STATUS[name] ?? 'ACTIVE';
    const sub = `PHASE ${String(idx + 1).padStart(2, '0')}/06 — ${name}`;
    pushStatus(word, sub);
    if (statusVal) {
      statusVal.classList.toggle('is-online', name === 'ONLINE');
    }
  };

  /* anime.js counter — modules seated (0 until the engine attaches) */
  const countEl = q('#s01-count', stage);
  const counter = { v: 0 };
  let counterInst: anime.AnimeInstance | null = null;
  const updateCounter = (target: number): void => {
    if (counterInst) counterInst.pause();
    counterInst = anime({
      targets: counter,
      v: target,
      round: 1,
      duration: 520,
      easing: 'easeOutQuart',
      update: () => {
        if (countEl) countEl.textContent = String(counter.v).padStart(2, '0');
      },
    });
  };
  updateCounter(0);

  /* lazy engine attachment — null until the Three.js chunk resolves */
  let engine: EngineController | null = null;

  const schem = q('.s01-schematic', stage);
  if (schem) schem.hidden = false;
  const bgword = q('.s01-bgword', stage);
  const chapters = Array.from(
    stage.querySelectorAll<HTMLElement>('.s01-ch')
  );
  const links = Array.from(stage.querySelectorAll<HTMLElement>('[data-link]'));
  const linkIn = [0.66, 0.69, 0.72, 0.75, 0.78];

  /* ================= THE ONE SOURCE OF TRUTH =========================
     Everything below is a pure function of progress ∈ [0, 1]. */
  let currentP = 0;
  const renderSystem01 = (p: number): void => {
    currentP = p;

    /* --- Three.js engine (lazy; no-op until attached) --- */
    engine?.setProgress(p);

    /* --- active chapter + HUD/rail state (stepped at boundaries) --- */
    let idx = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (p >= CHAPTERS[i].at) idx = i;
    }
    applyChapter(idx);

    /* --- CHAPTER CROSSFADES — overlapping, derived from progress ---
       Outgoing 1→0 and incoming 0→1 share the SAME window; at its
       centre both sit at 50%. Chapter 06 ONLINE never fades out. */
    chapters.forEach((ch, i) => {
      let o = 1;
      if (i > 0) {
        const b = BOUNDARIES[i - 1];
        o *= cross(p, b, windowFor(b));
      }
      if (i < BOUNDARIES.length) {
        const b = BOUNDARIES[i];
        o *= 1 - cross(p, b, windowFor(b));
      }
      ch.style.opacity = o.toFixed(4);
      ch.style.visibility = o > 0.001 ? 'visible' : 'hidden';
    });

    /* --- SCHEMATIC — strict phase discipline (piecewise track) --- */
    if (schem) {
      const so = track(p, [
        [0, 0.85], [0.14, 0.85], [0.26, 0.04], [0.30, 0.04], [0.34, 0],
      ]);
      schem.style.opacity = so.toFixed(4);
      const sc = 1 + 0.02 * track(p, [[0.14, 0], [0.34, 1]]);
      schem.style.transform = `scale(${sc.toFixed(4)})`;
      schem.style.display = p >= 0.34 ? 'none' : '';
    }

    /* --- BACKGROUND WORD — decorative opacity track, 0 at the end --- */
    if (bgword) {
      bgword.style.opacity = track(p, [
        [0, 0.14], [0.14, 0.14], [0.2, 0.05], [0.3, 0.05],
        [0.34, 0.03], [0.38, 0.03], [0.42, 0.05], [0.62, 0.05],
        [0.66, 0.035], [0.86, 0.035], [0.9, 0.05], [0.97, 0.05], [1, 0],
      ]).toFixed(4);
    }

    /* --- SYNCHRONIZE LINK LIST — armed inside its chapter only --- */
    links.forEach((li, i) => {
      li.classList.toggle('is-linked', p >= linkIn[i] && p < 0.855);
    });

    /* --- module counter follows the engine's seated count --- */
    const arrived = engine ? engine.getArrived() : 0;
    if (arrived !== Math.round(counter.v)) updateCounter(arrived);
  };

  /* smoothing: ONE quickTo proxy gives the scrub-0.8 feel without a
     timeline fighting for property control */
  const prog = { p: 0 };
  const pTo = gsap.quickTo(prog, 'p', {
    duration: 0.45,
    ease: 'power2.out',
    onUpdate: () => renderSystem01(prog.p),
  });

  /* ==================== THE ONE MASTER SCROLLTRIGGER ====================
     Created synchronously at module mount (not inside an async boot), so
     the pin exists from the first layout pass and the ONE refresh below
     measures the whole homepage with the spacer in place. No timeline —
     onUpdate feeds the smoothed progress into renderSystem01(). */
  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    /* Viewport-derived pin distance. The six-phase choreography is
       progress-normalized (0→1), so pin length only sets PACING:
       ≈1.8 viewport heights on fine-pointer, ≈1.6 on touch.
       invalidateOnRefresh re-evaluates this on resize. */
    end: () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const vh = Math.max(1, window.innerHeight);
      return `+=${Math.round(vh * (coarse ? 1.6 : 1.8))}`;
    },
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => pTo(self.progress),
    /* HUD ownership follows the pin itself: released when the stage
       leaves, re-claimed when scrolling back in */
    onLeave: () => {
      hudReleased = true;
      hudSet.hpHudReleaseStatus?.();
      if (hudSub) hudSub.textContent = '';
    },
    onEnterBack: () => {
      hudReleased = false;
      lastCh = -1;
    },
  });

  /* initial paint at wherever the page actually loaded (mid-pin safe) */
  renderSystem01(st.progress);
  pushStatus('SCANNING', 'PHASE 01/06 — REFERENCE');

  /* ============ ENGINE LOADER (lazy, once — NEVER pins) ============
     Loads the Three.js engine as the stage approaches. It only ever
     ATTACHES to the master progress — it never creates triggers, pins,
     RAF scroll loops or listeners of its own beyond its render loop
     (gated by IntersectionObserver + visibilitychange). */
  const loaderTrigger = ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom+=200px',
    once: true,
    onEnter: () => {
      loaderTrigger.kill();
      import('./system01')
        .then(({ createSystem01 }) => {
          const mount = q('.s01-mount', stage);
          if (!mount) return;
          const controller = createSystem01(mount, {
            onReady: () => stage.classList.add('is-live'),
          });
          if (!controller) {
            /* no WebGL — resolve to the static schematic composition */
            st.kill();
            mountFallback();
            ScrollTrigger.refresh();
            return;
          }
          engine = controller;
          /* jump the engine to wherever the master already is */
          controller.setProgress(currentP);
          updateCounter(controller.getArrived());
        })
        .catch(() => {
          st.kill();
          mountFallback();
          ScrollTrigger.refresh();
        });
    },
  });

  /* ============ THE ONE DETERMINISTIC REFRESH ============
     Homepage initialization sequence ends here: initHome() built every
     other trigger without refreshing; the master + its pin spacer now
     exist, so a single final ScrollTrigger.refresh() measures the whole
     page consistently. (home.ts intentionally performs no refresh.) */
  ScrollTrigger.refresh();

  if (DEBUG) {
    const dump = (): void => {
      const r = stage.getBoundingClientRect();
      const sy = window.scrollY;
      const next = stage.nextElementSibling as HTMLElement | null;
      const nr = next?.getBoundingClientRect();
      const pinSpacer = st.pin?.parentElement as HTMLElement | null;
      console.log(
        '[SYSTEM_01 DEBUG]\n' +
        `  stageHeight: ${r.height}px\n` +
        `  stageTop(abs): ${r.top + sy}\n` +
        `  start: ${st.start}  end: ${st.end}\n` +
        `  pinDistance: ${st.end - st.start}\n` +
        `  spacerHeight: ${pinSpacer?.offsetHeight ?? 'n/a'}\n` +
        `  nextSectionTop(abs): ${nr ? nr.top + sy : 'n/a'}\n` +
        `  progress: ${st.progress.toFixed(3)}`
      );
    };
    requestAnimationFrame(dump);
    ScrollTrigger.addEventListener('refresh', dump);
  }

  const cleanup = (): void => {
    engine?.dispose();
    gsap.killTweensOf(prog);
    st.kill();
    if (counterInst) counterInst.pause();
  };
  window.addEventListener('pagehide', cleanup, { once: true });
}
