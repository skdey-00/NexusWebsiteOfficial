/**
 * JOURNEY — cinematic archive timeline for the About page.
 *
 * Desktop: pins the stage and plays a scroll-driven chapter sequence.
 *   - one master scrubbed timeline drives everything (year swaps, axis
 *     fill, node states, readout) so every element stays in lockstep
 *   - chapters swap via clip-path masks, media parallax inside masks,
 *     massive year typography with defocus exit
 * Mobile / reduced-motion: no pin, chapters become a vertical editorial
 *   flow (CSS handles layout; JS only does light entrance reveals).
 *
 * Requires the .journey root on the page; safe no-op otherwise.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { MILESTONES } from './data/journey-data';

gsap.registerPlugin(ScrollTrigger);

interface ChapterEls {
  year: HTMLElement;
  yearGhost: HTMLElement | null;
  panel: HTMLElement;
  mediaMask: HTMLElement | null;
  media: HTMLElement | null;
}

export function initJourney(lenis: Lenis | null): void {
  const journey = document.querySelector<HTMLElement>('.journey');
  if (!journey) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = gsap.utils.toArray<HTMLElement>('.j-chapter');
  if (chapters.length === 0) return;

  /* ------------------------------------------------------------------
   * INTRO — load-in reveal (clip masks + stagger)
   * ------------------------------------------------------------------ */
  const introLines = journey.querySelectorAll<HTMLElement>('.j-line-inner');
  if (introLines.length && !reduced) {
    gsap.to(introLines, {
      y: '0%',
      duration: 1.4,
      ease: 'power4.out',
      stagger: 0.12,
      delay: 0.2,
      onComplete: () => introLines.forEach((l) => (l.style.willChange = 'auto'))
    });
  } else if (introLines.length) {
    introLines.forEach((l) => (l.style.transform = 'none'));
  }

  /* ------------------------------------------------------------------
   * Responsive mount: pinned sequence only on desktop widths, light
   * reveals on mobile. gsap.matchMedia auto-cleans on breakpoint cross.
   * ------------------------------------------------------------------ */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 961px) and (prefers-reduced-motion: no-preference)', () => {
    initDesktopSequence(journey, chapters, lenis);
  });

  mm.add('(max-width: 960px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.utils.toArray<HTMLElement>('.j-chapter .j-year').forEach((year) => {
      gsap.from(year, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: year, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
    const targets = journey.querySelectorAll<HTMLElement>(
      '.j-chapter-title, .j-desc, .j-data-row, .j-spec-row, .j-dept-row'
    );
    targets.forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 18,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' }
      });
    });
  });
}

/* -------------------------------------------------------------------- */
/* desktop sequence                                                     */
/* -------------------------------------------------------------------- */
function initDesktopSequence(
  journey: HTMLElement,
  chapters: HTMLElement[],
  lenis: Lenis | null
): void {
  const stage = journey.querySelector<HTMLElement>('.j-stage');
  if (!stage) return;

  const axisFill = journey.querySelector<HTMLElement>('.j-axis-fill');
  const axisNodes = journey.querySelectorAll<HTMLElement>('.j-axis-node');
  const railNodes = journey.querySelectorAll<HTMLElement>('.j-rail-node');
  const bg = journey.querySelector<HTMLElement>('.j-bg');
  const readoutIndex = journey.querySelector<HTMLElement>('#j-readout-index');
  const readoutYear = journey.querySelector<HTMLElement>('#j-readout-year');
  const readoutStatus = journey.querySelector<HTMLElement>('#j-readout-status');

  const perChapter = 1;   // relative timeline length per chapter
  const cross = 0.45;     // crossfade overlap
  const n = chapters.length;

  const master = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => `+=${stage.offsetHeight * n * 0.85}`,
      pin: true,
      scrub: 1.1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => updateReadout(self.progress)
    }
  });

  /* axis instrument fill — spans the whole sequence */
  if (axisFill) {
    master.fromTo(axisFill, { scaleY: 0 }, { scaleY: 1, duration: n * perChapter, ease: 'none' }, 0);
  }

  chapters.forEach((chapter, i) => {
    const els = collectEls(chapter);
    const at = i * perChapter;

    /* visibility on */
    master.fromTo(
      chapter,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.12 },
      at
    );

    /* panel: clip-mask reveal from bottom */
    master.fromTo(
      els.panel,
      { clipPath: 'inset(100% 0 0 0)' },
      { clipPath: 'inset(0% 0 0 0)', duration: cross, ease: 'power2.inOut' },
      at + 0.08
    );

    /* media: center-out mask reveal that ENDS at the designed crop,
       plus a settle parallax inside the mask */
    if (els.mediaMask && els.media) {
      master.fromTo(
        els.mediaMask,
        { clipPath: 'inset(50% 0 50% 0)' },
        { clipPath: getComputedMask(els.mediaMask), duration: cross, ease: 'power2.inOut' },
        at + 0.06
      );
      master.fromTo(
        els.media,
        { yPercent: -8, scale: 1.12 },
        { yPercent: 0, scale: 1, duration: perChapter + cross, ease: 'power1.inOut' },
        at
      );
    }

    /* year: rise, settle, drift up + defocus out */
    master.fromTo(
      els.year,
      { yPercent: 26 },
      { yPercent: -4, duration: cross + 0.25, ease: 'power3.out' },
      at
    );
    master.to(els.year, {
      filter: 'blur(10px)',
      duration: 0.5,
      ease: 'power2.in'
    }, at + cross + 0.15);
    master.to(els.year, {
      yPercent: -46,
      scale: 0.94,
      autoAlpha: 0,
      duration: 0.55,
      ease: 'power2.in'
    }, at + cross + 0.3);

    /* ghost year drift-in, fade with the chapter */
    if (els.yearGhost) {
      master.fromTo(
        els.yearGhost,
        { yPercent: 40, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: cross + 0.2, ease: 'power2.out' },
        at
      );
      master.to(els.yearGhost, { autoAlpha: 0, duration: 0.4 }, at + cross + 0.35);
    }

    /* panel exit: clip up */
    master.to(els.panel, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.5,
      ease: 'power2.in'
    }, at + cross + 0.32);

    /* chapter visibility off (except final) */
    if (i < n - 1) {
      master.to(chapter, { autoAlpha: 0, duration: 0.12 }, at + cross + 0.52);
    }

    /* instrument node states — discrete callbacks */
    if (i < axisNodes.length) {
      master.call(() => setNodeState(axisNodes[i], true), undefined, at + 0.05);
      if (i > 0) master.call(() => setNodeState(axisNodes[i - 1], false), undefined, at + 0.05);
    }
    if (i < railNodes.length) {
      master.call(() => setNodeState(railNodes[i], true), undefined, at + 0.05);
      if (i > 0) master.call(() => setNodeState(railNodes[i - 1], false), undefined, at + 0.05);
    }
  });

  /* final instrument state */
  master.call(() => {
    axisNodes.forEach((node) => setNodeState(node, true));
    railNodes.forEach((node) => setNodeState(node, true));
  }, undefined, (n - 1) * perChapter + 0.9);

  /* readout — progress-mapped, instrument-like */
  function updateReadout(progress: number): void {
    const idx = Math.min(n - 1, Math.floor(progress * n * 1.02));
    const ms = MILESTONES[idx];
    if (readoutIndex) {
      readoutIndex.textContent =
        String(idx + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    }
    if (readoutYear) readoutYear.textContent = ms ? String(ms.year) : '—';
    if (readoutStatus) readoutStatus.textContent = ms ? ms.status : '—';
  }

  /* background: slow counter-drift */
  if (bg) {
    gsap.fromTo(bg, { yPercent: 0 }, {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* intro parallax exit */
  const introTitle = journey.querySelector<HTMLElement>('.j-intro-title');
  if (introTitle) {
    gsap.to(introTitle, {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: { trigger: '.j-intro', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* rail nodes clickable → glide to chapter */
  const st = master.scrollTrigger;
  railNodes.forEach((node, i) => {
    node.addEventListener('click', () => {
      if (!st) return;
      const target = st.start + ((st.end - st.start) * i) / n;
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* -------------------------------------------------------------------- */
/* helpers                                                              */
/* -------------------------------------------------------------------- */

function collectEls(chapter: HTMLElement): ChapterEls {
  return {
    year: chapter.querySelector<HTMLElement>('.j-year') as HTMLElement,
    yearGhost: chapter.querySelector<HTMLElement>('.j-year-ghost'),
    panel: chapter.querySelector<HTMLElement>('.j-panel') as HTMLElement,
    mediaMask: chapter.querySelector<HTMLElement>('.j-media-mask'),
    media: chapter.querySelector<HTMLElement>('.j-media')
  };
}

function getComputedMask(el: HTMLElement): string {
  const m = getComputedStyle(el).clipPath;
  return m && m !== 'none' ? m : 'inset(0 0 0 0)';
}

function setNodeState(node: Element, active: boolean): void {
  node.classList.toggle('is-active', active);
}
