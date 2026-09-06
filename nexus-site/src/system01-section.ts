/**
 * SYSTEM_01 / ASSEMBLY — homepage scroll choreography (chapter 03)
 * CONTENT FIRST · ROBOT SECOND · UI THIRD
 *
 * ARCHITECTURE — ONE SCROLL OWNER:
 *   initSystem01Section() synchronously creates THE master ScrollTrigger
 *   (pins #s01-stage, scrubs ONE normalized 0→1 timeline). Everything
 *   editorial — chapter visibility, schematic crossfade, background
 *   typography, link arming, HUD words, module counter — is a track on
 *   that timeline. The Three.js engine is a LAZY ATTACHMENT: when its
 *   chunk resolves it receives the live progress scalar; until then the
 *   section already scrolls and pins correctly with the reference
 *   schematic. No second ScrollTrigger ever positions or drives
 *   SYSTEM_01 (the engine loader is a once-only onEnter, killed on use).
 *
 * Chapter map (scroll 0 to 1 — timeline duration is EXACTLY 1):
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
 * Initialization order (see also main.ts / home.ts):
 *   DOM ready → initHome() builds every other homepage trigger → this
 *   module mounts → master trigger created → ONE ScrollTrigger.refresh()
 *   measures the whole homepage WITH the pin spacer. home.ts performs no
 *   refresh of its own, so there are no competing startup measurements.
 *
 * Diagnostics: append ?s01debug to the URL for [SYSTEM_01 DEBUG]
 * geometry logs (stage, trigger start/end, pin distance, spacer height,
 * next section top, timeline duration).
 *
 * Fallbacks: no WebGL / engine failure → kill timeline, static schematic
 * composition. prefers-reduced-motion → same static composition, and no
 * pin or timeline is ever created.
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
  const applyChapter = (idx: number): void => {
    if (idx === lastCh) return;
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

  /* ==================== THE ONE MASTER SCROLLTRIGGER ====================
     Created synchronously at module mount (not inside an async boot), so
     the pin exists from the first layout pass and the ONE refresh below
     measures the whole homepage with the spacer in place. */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      /* Viewport-derived pin distance. The six-phase choreography is
         progress-normalized (0→1), so pin length only sets PACING:
         ≈1.8 viewport heights on fine-pointer (within the 1.7–2.1
         target), ≈1.6 on touch (within 1.4–1.8). invalidateOnRefresh
         re-evaluates this on resize. */
      end: () => {
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        const vh = Math.max(1, window.innerHeight);
        return `+=${Math.round(vh * (coarse ? 1.6 : 1.8))}`;
      },
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        engine?.setProgress(p);
        let idx = 0;
        for (let i = 0; i < CHAPTERS.length; i++) {
          if (p >= CHAPTERS[i].at) idx = i;
        }
        applyChapter(idx);
        const arrived = engine ? engine.getArrived() : 0;
        if (arrived !== Math.round(counter.v)) updateCounter(arrived);
      },
    },
  });

  /* ============ CHAPTER VISIBILITY TRACKS ============
     Each chapter block: quick masked rise, hold, quick release.
     Chapter 06 ONLINE is the resolution — it does NOT fade out; it
     stays visible through pin release and rides out with the stage as
     THE COLLECTIVE enters. This keeps the timeline's effective duration
     at exactly 1.0 (no tween may end past the final beat). */
  const chapters = Array.from(
    stage.querySelectorAll<HTMLElement>('.s01-ch')
  );
  const chIn = [0.010, 0.150, 0.310, 0.435, 0.635, 0.870];
  const chOut = [0.115, 0.275, 0.405, 0.600, 0.845];

  chapters.forEach((ch, i) => {
    tl.fromTo(ch,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.02, ease: 'none' },
      chIn[i]);
    if (i < chOut.length) {
      tl.to(ch, { autoAlpha: 0, duration: 0.018, ease: 'none' }, chOut[i]);
    }
    const kids = ch.querySelectorAll<HTMLElement>(
      '.s01-ch-title, .s01-ch-body, .s01-ch-data, .s01-links, .s01-final-meta'
    );
    kids.forEach((line, j) => {
      tl.fromTo(line,
        { clipPath: 'inset(0 0 100% 0)', y: 18, opacity: 0 },
        { clipPath: 'inset(0 0 0% 0)', y: 0, opacity: 1,
          duration: 0.03, ease: 'power2.out' },
        chIn[i] + 0.006 + j * 0.008);
    });
  });

  /* ============ SCHEMATIC — strict phase discipline ============
     01 REFERENCE: schematic alone at full strength (also the pre-engine
     02 TRANSITION: crossfade 0.14 to 0.26 as parts emerge at 0.16.
     After 0.30: gone (display none at 0.34). */
  const schem = q('.s01-schematic', stage);
  if (schem) {
    schem.hidden = false;
    tl.set(schem, { opacity: 0.85, scale: 1 }, 0);
    tl.to(schem, { opacity: 0.04, scale: 1.02, duration: 0.12, ease: 'power1.inOut' }, 0.14);
    tl.to(schem, { opacity: 0, duration: 0.04, ease: 'none' }, 0.30);
    tl.set(schem, { display: 'none' }, 0.34);
  }

  /* ============ BG TYPOGRAPHY DISCIPLINE ============
     Decorative word: 0.14 idle, 0.05 content, 0.03-0.05 body, 0 final. */
  const bgword = q('.s01-bgword', stage);
  if (bgword) {
    tl.set(bgword, { opacity: 0.14 }, 0);
    tl.to(bgword, { opacity: 0.05, duration: 0.06, ease: 'none' }, 0.14);
    tl.to(bgword, { opacity: 0.03, duration: 0.04, ease: 'none' }, 0.30);
    tl.to(bgword, { opacity: 0.05, duration: 0.04, ease: 'none' }, 0.38);
    tl.to(bgword, { opacity: 0.035, duration: 0.04, ease: 'none' }, 0.62);
    tl.to(bgword, { opacity: 0.05, duration: 0.04, ease: 'none' }, 0.86);
    tl.to(bgword, { opacity: 0, duration: 0.03, ease: 'none' }, 0.97);
  }

  /* ============ SYNCHRONIZE LINK LIST ============
     Systems link one by one, then release together at chapter end. */
  const links = Array.from(stage.querySelectorAll<HTMLElement>('[data-link]'));
  const linkIn = [0.66, 0.69, 0.72, 0.75, 0.78];
  links.forEach((li, i) => {
    tl.call(() => li.classList.add('is-linked'), undefined, linkIn[i]);
    tl.call(() => li.classList.remove('is-linked'), undefined, 0.855);
  });

  /* ============ ONLINE final cue ============ */
  tl.call(() => {
    if (statusVal) statusVal.classList.add('is-online');
  }, undefined, 0.86);

  /* hand status ownership back when the pin releases */
  tl.call(() => {
    hudSet.hpHudReleaseStatus?.();
    if (hudSub) hudSub.textContent = '';
  }, undefined, 0.995);

  pushStatus('SCANNING', 'PHASE 01/06 — REFERENCE');

  /* ============ ENGINE LOADER (lazy, once) ============
     Loads the Three.js engine as the stage approaches. It only ever
     ATTACHES to the master timeline's progress — it never creates
     triggers, pins, RAF scroll loops or listeners of its own beyond its
     render loop (gated by IntersectionObserver + visibilitychange). */
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
            tl.scrollTrigger?.kill();
            tl.kill();
            mountFallback();
            ScrollTrigger.refresh();
            return;
          }
          engine = controller;
          /* jump the engine to wherever the master already is */
          const p = tl.scrollTrigger?.progress ?? 0;
          controller.setProgress(p);
          updateCounter(controller.getArrived());
        })
        .catch(() => {
          tl.scrollTrigger?.kill();
          tl.kill();
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
      const st = tl.scrollTrigger;
      if (!st) return;
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
        `  timelineDuration: ${tl.duration()}\n` +
        `  progress: ${st.progress.toFixed(3)}`
      );
    };
    requestAnimationFrame(dump);
    ScrollTrigger.addEventListener('refresh', dump);
  }

  const cleanup = (): void => {
    engine?.dispose();
    tl.scrollTrigger?.kill();
    tl.kill();
    if (counterInst) counterInst.pause();
  };
  window.addEventListener('pagehide', cleanup, { once: true });
}
