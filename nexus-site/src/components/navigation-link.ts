/**
 * NAVIGATION LINK — one technical route entry.
 *
 *   01  ABOUT
 *   ──────────
 *
 * Index reveals on hover (and on the active route), a 1px cyan rule
 * draws beneath, the label drifts 2px. No pills, no glows, no scaling.
 */
import type { NavItem } from '../config/navigation';

export function createNavigationLink(item: NavItem, isActive: boolean): string {
    const current = isActive ? ' aria-current="page"' : '';
    return `
      <a class="gn-link${isActive ? ' is-active' : ''}" href="${item.route}"${current}>
        <span class="gn-link-index" aria-hidden="true">${item.index}</span>
        <span class="gn-link-label">${item.label}</span>
        <span class="gn-link-rule" aria-hidden="true"></span>
      </a>`;
}
