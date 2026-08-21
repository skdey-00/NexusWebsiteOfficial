/**
 * THE NEXUS NETWORK — sponsors page experience.
 *
 * Sections:
 *   01 hero      cinematic editorial entry (no logos — prestige first)
 *   02 archive   sticky sidebar + scroll showcase, one partner/viewport
 *   03 impact    support streams -> sequential engineering outcomes
 *   04 metrics   engineering data readout (verified numbers only)
 *   05 vectors   partnership vectors (interactive rows)
 *   06 cta       ENTER THE NETWORK
 *
 * Requires the #nw-root root; safe no-op otherwise.
 * Motion: precision/mechanical — mask reveals, line expansions, scrubbed
 * index progression. No bouncing, no glitch, no particles.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { PARTNERS } from './data/partners-data';
import type { Partner } from './data/partners-data';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(sel);

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** logo path — the folder name keeps the historical misspelling */
const logoSrc = (p: Partner): string => `/Images/Sponsers list/${p.logo}`;

/* ------------------------------------------------------------------ */
/* 02 — PARTNER ARCHIVE                                                */
/* ------------------------------------------------------------------ */

function renderArchive(): void {
  const stage = $('#nw-arch-stage');
  const rail = $('#nw-rail');
  if (!stage || !rail) return;

  PARTNERS.forEach((p, i) => {
    // ----- rail item -----
    const ri = document.createElement('button');
    ri.type = 'button';
    ri.className = 'nw-rail-item';
    ri.dataset.index = String(i);
    ri.setAttribute('aria-label', `Showcase ${p.name}`);
    ri.innerHTML = `<span class="nw-rail-no">${pad2(i + 1)}</span><span class="nw-rail-name">${p.name}</span><span class="nw-rail-line"></span>`;
    rail.appendChild(ri);

    // ----- stage partner -----
    const card = document.createElement('article');
    card.className = 'nw-partner';
    card.dataset.slot = p.slot;
    card.dataset.index = String(i);
    const note = p.note ? `<p class="nw-p-note">${p.note}</p>` : '';
    const link = p.url
      ? `<a class="nw-p-link" href="${p.url}" target="_blank" rel="noopener noreferrer">VISIT PARTNER <span class="nw-arrow">&#8594;</span></a>`
      : '';
    card.innerHTML = `
      <div class="nw-p-index">${pad2(i + 1)}</div>
      <div class="nw-p-id">
        <div class="nw-p-kicker"><span class="nw-label">01 / PARTNER</span><span class="nw-rule"></span></div>
        <h3 class="nw-p-name">${p.name}</h3>
        <p class="nw-p-class">${p.classification}</p>
        ${note}
        ${link}
      </div>
      <div class="nw-p-logo-cell">
        <div class="nw-p-logo-frame">
          <img src="${logoSrc(p)}" alt="${p.name} logo" loading="lazy" decoding="async" draggable="false">
        </div>
      </div>`;
    stage.appendChild(card);
  });

  // count in sidebar
  const total = $('#nw-total');
  if (total) total.textContent = pad2(PARTNERS.length);
  const total2 = $('#nw-total-2');
  if (total2) total2.textContent = String(PARTNERS.length);
}

/* ------------------------------------------------------------------ */
/* module state                                                        */
/* ------------------------------------------------------------------ */

let lenisRef: Lenis | null = null;

/* ------------------------------------------------------------------ */
/* 02 — ARCHIVE MOTION : live-state progression + logo mask reveals    */
/* ------------------------------------------------------------------ */

function initArchiveMotion(): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.nw-partner'));
  const railItems = Array.from(document.querySelectorAll<HTMLElement>('.nw-rail-item'));
  const current = $('#nw-current');
  if (!cards.length) return;

  const setActive = (idx: number): void => {
    cards.forEach((c, i) => c.classList.toggle('is-live', i === idx));
    railItems.forEach((r, i) => r.classList.toggle('is-active', i === idx));
    if (current) current.textContent = pad2(idx + 1);
  };

  // rail click -> glide to that partner (Lenis when available)
  railItems.forEach((r) => {
    r.addEventListener('click', () => {
      const idx = parseInt(r.dataset.index || '0', 10);
      const target = cards[idx];
      if (!target) return;
      if (lenisRef) {
        lenisRef.scrollTo(target, { offset: -70 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (reduced()) {
    cards.forEach((c) => c.classList.add('is-live'));
    if (current) current.textContent = '01';
    return;
  }

  // one ScrollTrigger per partner: is-live state + entrance reveals
  cards.forEach((card, i) => {
    const name = card.querySelector('.nw-p-name');
    const cls = card.querySelector('.nw-p-class');
    const note = card.querySelector('.nw-p-note');
    const link = card.querySelector('.nw-p-link');
    const frame = card.querySelector('.nw-p-logo-frame');
    const img = card.querySelector('.nw-p-logo-frame img');
    const idxGhost = card.querySelector('.nw-p-index');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top 62%',
        end: 'bottom 38%',
        toggleActions: 'play none none reverse',
        onToggle: (self) => {
          if (self.isActive) setActive(i);
        }
      }
    });

    if (name) tl.from(name, { yPercent: 110, duration: 0.85, ease: 'power4.out' }, 0);
    if (cls) tl.from(cls, { opacity: 0, x: -14, duration: 0.6, ease: 'power3.out' }, 0.18);
    if (note) tl.from(note, { opacity: 0, y: 12, duration: 0.6, ease: 'power3.out' }, 0.3);
    if (link) tl.from(link, { opacity: 0, duration: 0.5 }, 0.4);
    // logo mask reveal — clip wipe; logo itself only scales inside its frame
    if (frame && img) {
      tl.fromTo(frame, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.0, ease: 'power4.inOut' }, 0.05)
        .from(img, { scale: 1.12, duration: 1.0, ease: 'power4.inOut' }, 0.05);
    }
    if (idxGhost) tl.from(idxGhost, { opacity: 0, duration: 0.8 }, 0.2);

    // subtle parallax drift on the ghost index
    if (idxGhost) {
      gsap.fromTo(idxGhost, { yPercent: -8 }, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    }
  });

  setActive(0);
}

/* ------------------------------------------------------------------ */
/* 01 — HERO MOTION : clip-mask line reveals, restrained               */
/* ------------------------------------------------------------------ */

function initHeroMotion(): void {
  const hero = $('#nw-hero');
  if (!hero || reduced()) return;

  const tl = gsap.timeline({ delay: 0.15 });
  tl.from('.nw-hero-kicker .nw-label', { opacity: 0, x: -18, duration: 0.7, ease: 'power3.out' })
    .from('.nw-hero-kicker .nw-rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.8, ease: 'power4.inOut' }, 0.1)
    .from('.nw-hero-title .nw-line > span', { yPercent: 112, duration: 1.1, ease: 'power4.out', stagger: 0.12 }, 0.25)
    .from('.nw-hero-sub p', { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out' }, 0.9)
    .from('.nw-hero-meta-top .nw-label, .nw-hero-meta-bottom .nw-label', { opacity: 0, duration: 0.7, stagger: 0.06 }, 1.0)
    .from('.nw-corner', { opacity: 0, scale: 0.6, duration: 0.6, ease: 'power3.out', stagger: 0.05 }, 1.05);

  // title recedes slightly as the archive approaches
  gsap.to('.nw-hero-title', {
    yPercent: -6,
    opacity: 0.35,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 }
  });
}

/* ------------------------------------------------------------------ */
/* 03 — IMPACT : streams activate, chain steps light sequentially      */
/* ------------------------------------------------------------------ */

function initImpactMotion(): void {
  const impact = $('#nw-impact');
  if (!impact) return;

  if (reduced()) {
    impact.querySelectorAll('.nw-stream').forEach((s) => s.classList.add('is-on'));
    impact.querySelectorAll('.nw-chain li').forEach((li) => li.classList.add('is-on'));
    return;
  }

  // heading lines reveal
  gsap.from('.nw-impact-title .nw-line > span', {
    scrollTrigger: { trigger: impact, start: 'top 72%' },
    yPercent: 112,
    duration: 1.0,
    ease: 'power4.out',
    stagger: 0.1
  });

  // each stream: rule draws, then steps arm one by one
  impact.querySelectorAll<HTMLElement>('.nw-stream').forEach((stream, si) => {
    const steps = Array.from(stream.querySelectorAll<HTMLElement>('.nw-chain li'));
    const tl = gsap.timeline({
      scrollTrigger: { trigger: stream, start: 'top 70%', toggleActions: 'play none none reverse' }
    });
    tl.call(() => stream.classList.add('is-on'), undefined, 0.1 + si * 0.15);
    steps.forEach((li, i) => {
      tl.call(() => li.classList.add('is-on'), undefined, 0.35 + si * 0.15 + i * 0.14);
    });
  });

  // resolve line
  const resolve = impact.querySelector('.nw-impact-resolve');
  if (resolve) {
    gsap.from(resolve.children, {
      scrollTrigger: { trigger: resolve, start: 'top 82%' },
      opacity: 0,
      y: 22,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.12
    });
  }
}

/* ------------------------------------------------------------------ */
/* 04 — METRICS : rows slide in, numbers count up subtly               */
/* ------------------------------------------------------------------ */

function initMetricsMotion(): void {
  const metrics = $('#nw-metrics');
  if (!metrics) return;

  if (reduced()) {
    metrics.querySelectorAll<HTMLElement>('.nw-count').forEach((n) => {
      n.textContent = n.dataset.target || '0';
    });
    return;
  }

  metrics.querySelectorAll<HTMLElement>('.nw-row').forEach((row, i) => {
    gsap.from(row, {
      scrollTrigger: { trigger: row, start: 'top 88%' },
      opacity: 0,
      x: -26,
      duration: 0.7,
      ease: 'power3.out',
      delay: (i % 3) * 0.08
    });
  });

  metrics.querySelectorAll<HTMLElement>('.nw-count').forEach((num) => {
    const target = parseInt(num.dataset.target || '0', 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      scrollTrigger: { trigger: num, start: 'top 88%' },
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => { num.textContent = String(Math.round(obj.v)); }
    });
  });
}

/* ------------------------------------------------------------------ */
/* 05 — VECTORS : hover rows + touch/keyboard open state              */
/* ------------------------------------------------------------------ */

function initVectors(): void {
  const vectors = $('#nw-vectors');
  if (!vectors) return;

  // wire descriptions from data-desc attributes into the reveal element
  vectors.querySelectorAll<HTMLElement>('.nw-vector').forEach((row) => {
    const desc = row.querySelector<HTMLElement>('.nw-vector-desc');
    if (desc && row.dataset.desc) desc.textContent = row.dataset.desc;

    // touch + keyboard: click toggles open state (hover handles pointer)
    row.addEventListener('click', (e) => {
      if (window.matchMedia('(hover: hover)').matches) return;
      e.preventDefault();
      const wasOpen = row.classList.contains('is-open');
      vectors.querySelectorAll('.nw-vector').forEach((r) => r.classList.remove('is-open'));
      if (!wasOpen) row.classList.add('is-open');
    });
  });

  if (reduced()) return;

  gsap.from('.nw-vectors-title .nw-line > span', {
    scrollTrigger: { trigger: vectors, start: 'top 72%' },
    yPercent: 112,
    duration: 1.0,
    ease: 'power4.out',
    stagger: 0.1
  });

  vectors.querySelectorAll('.nw-vector').forEach((row, i) => {
    gsap.from(row, {
      scrollTrigger: { trigger: row, start: 'top 90%' },
      opacity: 0,
      y: 26,
      duration: 0.7,
      ease: 'power3.out',
      delay: i * 0.07
    });
  });
}

/* ------------------------------------------------------------------ */
/* 06 — CTA : mask reveal + rule expansion                            */
/* ------------------------------------------------------------------ */

function initCtaMotion(): void {
  const cta = $('#nw-cta');
  if (!cta || reduced()) return;

  gsap.timeline({ scrollTrigger: { trigger: cta, start: 'top 68%' } })
    .from('.nw-cta-label', { opacity: 0, y: 12, duration: 0.6, ease: 'power3.out' })
    .from('.nw-cta-title .nw-line > span', { yPercent: 112, duration: 1.0, ease: 'power4.out', stagger: 0.1 }, 0.1)
    .from('.nw-cta-copy', { opacity: 0, y: 18, duration: 0.7, ease: 'power3.out' }, 0.5)
    .from('.nw-btn', { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out', stagger: 0.1 }, 0.7);
}

/* ------------------------------------------------------------------ */
/* INIT                                                                */
/* ------------------------------------------------------------------ */

export function initNetwork(lenis: Lenis | null): void {
  const root = $('#nw-root');
  if (!root) return;

  lenisRef = lenis;
  renderArchive();
  initHeroMotion();
  initArchiveMotion();
  initImpactMotion();
  initMetricsMotion();
  initVectors();
  initCtaMotion();

  runPreviewHarness();
}

/* ------------------------------------------------------------------ */
/* PREVIEW HARNESS (dev only) — sponsors.html?p=<0..14> scrolls to     */
/* partner N in its live state; ?p=impact|metrics|vectors|cta jumps    */
/* to that section. Lets headless screenshots pin exact states.        */
/* ------------------------------------------------------------------ */

function runPreviewHarness(): void {
  const q = new URLSearchParams(location.search);
  const p = q.get('p');
  if (!p) return;
  const jump = (el: Element | null) => {
    if (!el) return;
    // route through Lenis when live — its ticker would otherwise revert a
    // native scrollTo; immediate+force pins the position for screenshots.
    if (lenisRef) {
      lenisRef.scrollTo(el as HTMLElement, { offset: -70, immediate: true, force: true });
    } else {
      const y = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo(0, y);
    }
  };
  if (/^\d+$/.test(p)) {
    const idx = parseInt(p, 10);
    const card = document.querySelectorAll('.nw-partner')[idx];
    if (card) {
      card.classList.add('is-live');
      jump(card);
    }
  } else if (['impact', 'metrics', 'vectors', 'cta'].includes(p)) {
    jump(document.getElementById('nw-' + p));
  }
}
