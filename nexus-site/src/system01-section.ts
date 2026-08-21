/**
 * SYSTEM_01 / ASSEMBLY — homepage scroll choreography (chapter 03)
 * CONTENT FIRST · ROBOT SECOND · UI THIRD
 *
 * One GSAP pin+scrub timeline drives six editorial chapters. The Three
 * engine consumes a single progress scalar. The instrument frame and
 * rail are PERSISTENT — never opacity-animated — only their VALUES
 * update (status word, chapter counter, link states).
 *
 * Chapter map (scroll 0 to 1):
 *   0.00-0.14  01 REFERENCE   schematic only, concept copy (no machine)
 *   0.14-0.30  02 DETECT      schematic crossfades out, first parts
 *   0.30-0.42  03 ANALYZE     copy left, machine right, robot dimmed
 *   0.42-0.62  04 ASSEMBLE    payoff - machine centre, full presence
 *   0.62-0.86  05 SYNCHRONIZE copy right, machine left, links arm
 *   0.86-1.00  06 ONLINE      quiet resolution, statement, metadata
 *
 * Strict blueprint discipline: schematic full only while no physical
 * geometry exists; crossfade 0.14 to 0.26; max 4% ghost after 0.30.
 *
 * Fallbacks: no WebGL / module failure -> schematic stays as static art.
 * prefers-reduced-motion -> static schematic + final statement, no pin.
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

  const loaderTrigger = ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom+=200px',
    once: true,
    onEnter: () => {
      loaderTrigger.kill();
      import('./system01')
        .then(({ createSystem01 }) => boot(createSystem01))
        .catch(() => mountFallback());
    },
  });

  function boot(
    create: (m: HTMLElement, o?: { onReady?: () => void }) =>
      { setProgress(p: number): void; getArrived(): number; dispose(): void } | null
  ): void {
    const mount = q('.s01-mount', stage);
    const schem = q('.s01-schematic', stage);
    if (!mount || !schem) return;

    const controller = create(mount, {
      onReady: () => stage.classList.add('is-live'),
    });
    if (!controller) {
      mountFallback();
      return;
    }

    /* persistent HUD: value updates only, never opacity animation */
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
    pushStatus('SCANNING', 'PHASE 01/06 — REFERENCE');

    /* anime.js counter - modules seated */
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

    /* the one pin+scrub timeline */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () =>
          window.matchMedia('(pointer: coarse)').matches ? '+=1800' : '+=2400',
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          controller.setProgress(p);
          let idx = 0;
          for (let i = 0; i < CHAPTERS.length; i++) {
            if (p >= CHAPTERS[i].at) idx = i;
          }
          applyChapter(idx);
          const arrived = controller.getArrived();
          if (arrived !== Math.round(counter.v)) updateCounter(arrived);
        },
      },
    });

    /* ============ CHAPTER VISIBILITY TRACKS ============
       Each chapter block: quick masked rise, hold, quick release. */
    const chapters = Array.from(
      stage.querySelectorAll<HTMLElement>('.s01-ch')
    );
    const chIn = [0.010, 0.150, 0.310, 0.435, 0.635, 0.870];
    const chOut = [0.115, 0.275, 0.405, 0.600, 0.845, 1.001];

    chapters.forEach((ch, i) => {
      tl.fromTo(ch,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.02, ease: 'none' },
        chIn[i]);
      tl.to(ch, { autoAlpha: 0, duration: 0.018, ease: 'none' }, chOut[i]);
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

    /* ============ SCHEMATIC - strict phase discipline ============
       01 REFERENCE: schematic alone at full strength.
       02 TRANSITION: crossfade 0.14 to 0.26 as parts emerge at 0.16.
       After 0.30: gone (display none at 0.34). */
    schem.hidden = false;
    tl.set(schem, { opacity: 0.85, scale: 1 }, 0);
    tl.to(schem, { opacity: 0.04, scale: 1.02, duration: 0.12, ease: 'power1.inOut' }, 0.14);
    tl.to(schem, { opacity: 0, duration: 0.04, ease: 'none' }, 0.30);
    tl.set(schem, { display: 'none' }, 0.34);

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

    ScrollTrigger.refresh();

    const cleanup = (): void => {
      controller.dispose();
      tl.scrollTrigger?.kill();
      tl.kill();
      if (counterInst) counterInst.pause();
    };
    window.addEventListener('pagehide', cleanup, { once: true });
  }
}
