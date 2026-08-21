/**
 * GLOBAL NAVBAR — the ONE site-wide navigation interface.
 * -------------------------------------------------------------------------
 * "THE NAVBAR IS THE INTERFACE. THE PAGES ARE THE EXPERIENCE."
 *
 * Three-anchor composition:
 *
 *   [ SOMAIYA VIDYAVIHAR (red) ]   ABOUT DEPARTMENTS ROBOTS [ NEXUS ] TEAM SPONSORS CONTACT   [ SOMAIYA TRUST (blue) ]
 *
 * - The Nexus core sits at the exact viewport center (the link groups
 *   are equal-flex on both sides, the institutional zones equal-flex
 *   outside them), so the composition is symmetric by construction.
 * - STATE 01 (page top): 84px, translucent. STATE 02 (scrolled): 60px,
 *   opaque + blur. One element, two classes — no second navbar.
 * - Mounted from the root entry (main.ts) into #gn-root; pages carry
 *   no navigation markup of their own. Only the active link + the
 *   page-context readout differ per route (derived from config).
 */
import { NAV_ITEMS, resolveNavState } from '../config/navigation';
import { createNavigationLink } from './navigation-link';
import { createBrandModule } from './brand-module';
import { createMobileNavigation, bindMobileNavigation } from './mobile-navigation';

export function mountGlobalNavbar(): void {
    const mount = document.getElementById('gn-root');
    if (!mount) return;

    const state = resolveNavState();

    const left = NAV_ITEMS.slice(0, 3)
        .map((item) => createNavigationLink(item, state.active?.route === item.route))
        .join('');

    const right = NAV_ITEMS.slice(3)
        .map((item) => createNavigationLink(item, state.active?.route === item.route))
        .join('');

    mount.innerHTML = `
      <header class="gn" id="gn">
        <a class="gn-inst gn-inst-vidyavihar" href="https://www.somaiya.edu" target="_blank" rel="noopener noreferrer" aria-label="Somaiya Vidyavihar">
          <img src="/Images/K J Somaiya College of Engineering.png" alt="Somaiya Vidyavihar">
        </a>

        <div class="gn-core">
          <nav class="gn-links gn-links-left" aria-label="Primary">${left}</nav>
          ${createBrandModule()}
          <nav class="gn-links gn-links-right" aria-label="Secondary">${right}</nav>
        </div>

        <a class="gn-inst gn-inst-trust" href="https://www.somaiyatrust.com" target="_blank" rel="noopener noreferrer" aria-label="Somaiya Trust">
          <img src="/Images/somaiya trust.png" alt="Somaiya Trust">
        </a>

        <div class="gn-meta" aria-hidden="true">
          <span class="gn-meta-dot"></span>
          <span class="gn-meta-label">${state.metaLabel}</span>
        </div>

        <button class="gn-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="gn-mobile">
          <span></span><span></span><span></span>
        </button>
      </header>
      ${createMobileNavigation(state)}`;

    const navbar = mount.querySelector<HTMLElement>('#gn')!;
    const drawer = mount.querySelector<HTMLElement>('#gn-mobile')!;
    const toggle = mount.querySelector<HTMLElement>('.gn-toggle')!;

    // ---- STATE 01 / STATE 02 — one element, two states -------------------
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            navbar.classList.toggle('is-scrolled', window.scrollY > 24);
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    bindMobileNavigation(drawer, toggle);
}
