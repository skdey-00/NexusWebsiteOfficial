/**
 * NEXUS NOW PAGE LOGIC
 *
 * Initializes the Nexus Now page with:
 * - KYNEX campaign countdown
 * - Operations queue rendering
 * - Field log timeline rendering
 * - Anime.js animations for technical elements
 * - Scroll-based reveals
 */

import anime from 'animejs';
import { NEXUS_NOW_DATA } from './data/nexus-now-data';

export function initNexusNow(): void {
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupNexusNow);
    } else {
        setupNexusNow();
    }
}

function setupNexusNow(): void {
    initKynexCountdown();
    initCompetitionInteractions();
    renderOperations();
    renderFieldLog();
    initAnimations();
}

/**
 * Initialize KYNEX countdown timer
 * Counts down to September 26, 2026 (KYNEX '26 event day)
 */
function initKynexCountdown(): void {
    const countdownElement = document.getElementById('kynex-countdown');
    if (!countdownElement) return;

    // Target date: September 26, 2026, 09:00:00 IST (event day)
    const targetDate = new Date('2026-09-26T09:00:00+05:30').getTime();

    function updateCountdown(): void {
        if (!countdownElement) return;

        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            // Event has started
            countdownElement.innerHTML = '<span class="kynex-countdown-label">EVENT STATUS:</span><span class="kynex-countdown-value kynex-countdown-value--active">REGISTRATION OPEN</span>';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update the countdown values
        const dayElement = countdownElement.querySelector('[data-unit="days"]');
        const hourElement = countdownElement.querySelector('[data-unit="hours"]');
        const minuteElement = countdownElement.querySelector('[data-unit="minutes"]');
        const secondElement = countdownElement.querySelector('[data-unit="seconds"]');

        if (dayElement) dayElement.textContent = String(days).padStart(2, '0');
        if (hourElement) hourElement.textContent = String(hours).padStart(2, '0');
        if (minuteElement) minuteElement.textContent = String(minutes).padStart(2, '0');
        if (secondElement) secondElement.textContent = String(seconds).padStart(2, '0');
    }

    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

/**
 * Initialize competition selection interactions
 */
function initCompetitionInteractions(): void {
    const competitions = document.querySelectorAll('.kynex-competition');

    competitions.forEach(competition => {
        competition.addEventListener('mouseenter', () => {
            // Subtle animation on hover
            anime({
                targets: competition.querySelector('.kynex-competition-decor'),
                opacity: [0.3, 0.5],
                duration: 300,
                easing: 'easeOutQuad'
            });
        });

        competition.addEventListener('mouseleave', () => {
            anime({
                targets: competition.querySelector('.kynex-competition-decor'),
                opacity: [0.5, 0.3],
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });
}

/**
 * Render operations queue
 */
function renderOperations(): void {
    const opsQueue = document.getElementById('nn-ops-queue');
    if (!opsQueue) return;

    const operations = NEXUS_NOW_DATA.operations;

    opsQueue.innerHTML = operations.map((op, index) => `
        <div class="nn-op" data-status="${op.status.toLowerCase()}" data-index="${index}">
            <div class="nn-op-header">
                <span class="nn-op-index">${String(index + 1).padStart(2, '0')}</span>
                <span class="nn-op-title">${op.title}</span>
                <span class="nn-op-status">STATUS — ${op.status}</span>
                <button class="nn-op-toggle" aria-expanded="false">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="nn-op-details">
                <p>${op.shortDescription}</p>
                ${op.expandedDetails ? `<p class="nn-op-expanded">${op.expandedDetails}</p>` : ''}
                ${op.date ? `<span class="nn-op-meta">${op.date}${op.location ? ` • ${op.location}` : ''}</span>` : ''}
                ${op.cta ? `<a class="nn-op-cta" href="${op.cta.link}">${op.cta.text}</a>` : ''}
            </div>
        </div>
    `).join('');

    // Add click handlers for operation expansion
    const toggles = opsQueue.querySelectorAll('.nn-op-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const op = (e.currentTarget as HTMLElement).closest('.nn-op') as HTMLElement;
            const details = op.querySelector('.nn-op-details') as HTMLElement;
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

            if (isExpanded) {
                details.setAttribute('hidden', '');
                toggle.setAttribute('aria-expanded', 'false');
                op.classList.remove('nn-op--expanded');
            } else {
                details.removeAttribute('hidden');
                toggle.setAttribute('aria-expanded', 'true');
                op.classList.add('nn-op--expanded');

                // Animate expansion
                anime({
                    targets: details,
                    height: [0, details.offsetHeight],
                    opacity: [0, 1],
                    easing: 'easeOutQuad',
                    duration: 400
                });
            }
        });
    });
}

/**
 * Render field log timeline
 */
function renderFieldLog(): void {
    const timeline = document.getElementById('nn-timeline');
    if (!timeline) return;

    const fieldLogEntries = NEXUS_NOW_DATA.fieldLog;

    timeline.innerHTML = fieldLogEntries.map((entry, index) => `
        <div class="nn-entry" data-index="${index}">
            <span class="nn-entry-date">${entry.date}</span>
            <span class="nn-entry-title">${entry.title}</span>
            <div class="nn-entry-details">
                <p>${entry.description}</p>
            </div>
        </div>
    `).join('');

    // Add click handlers for entry expansion
    const entryElements = timeline.querySelectorAll('.nn-entry');
    entryElements.forEach(entry => {
        entry.addEventListener('click', () => {
            const details = entry.querySelector('.nn-entry-details') as HTMLElement;
            const isExpanded = entry.classList.contains('nn-entry--expanded');

            if (isExpanded) {
                entry.classList.remove('nn-entry--expanded');
                details.setAttribute('hidden', '');
            } else {
                // Close other entries
                entryElements.forEach(other => {
                    if (other !== entry) {
                        other.classList.remove('nn-entry--expanded');
                        const otherDetails = other.querySelector('.nn-entry-details');
                        if (otherDetails) otherDetails.setAttribute('hidden', '');
                    }
                });

                entry.classList.add('nn-entry--expanded');
                details.removeAttribute('hidden');
            }
        });
    });
}

/**
 * Initialize animations
 */
function initAnimations(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Skip animations, show content immediately
        return;
    }

    // KYNEX Hero animations
    anime({
        targets: '.kynex-system-metadata',
        opacity: [0, 1],
        translateY: [-20, 0],
        easing: 'easeOutQuad',
        duration: 800,
        delay: 200
    });

    anime({
        targets: '.kynex-title',
        opacity: [0, 1],
        scale: [0.95, 1],
        easing: 'easeOutQuad',
        duration: 1000,
        delay: 400
    });

    anime({
        targets: '.kynex-tagline',
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutQuad',
        duration: 800,
        delay: 600
    });

    anime({
        targets: '.kynex-info-item',
        opacity: [0, 1],
        translateY: [15, 0],
        delay: anime.stagger(100, {start: 800}),
        easing: 'easeOutQuad',
        duration: 600
    });

    anime({
        targets: '.kynex-primary-cta .kynex-btn',
        opacity: [0, 1],
        translateY: [10, 0],
        delay: anime.stagger(100, {start: 1000}),
        easing: 'easeOutQuad',
        duration: 600
    });

    // Status module animations
    anime({
        targets: '.kynex-status-item',
        opacity: [0, 1],
        translateX: [-15, 0],
        delay: anime.stagger(80, {start: 1200}),
        easing: 'easeOutQuad',
        duration: 500
    });

    // Competition cards animation
    anime({
        targets: '.kynex-competition',
        opacity: [0, 1],
        translateY: [30, 0],
        delay: anime.stagger(150, {start: 1500}),
        easing: 'easeOutQuad',
        duration: 800
    });

    // Event parameters animation
    anime({
        targets: '.kynex-param-item',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100, {start: 2000}),
        easing: 'easeOutQuad',
        duration: 600
    });

    // Original Nexus Now animations
    anime({
        targets: '.nn-hero-type',
        opacity: [0, 1],
        translateY: [30, 0],
        easing: 'easeOutQuad',
        duration: 800,
        delay: 200
    });

    // Campaign phases animation (if they exist)
    const phases = document.querySelectorAll('.nn-phase');
    if (phases.length > 0) {
        anime({
            targets: '.nn-phase',
            opacity: [0, 1],
            translateX: [-20, 0],
            delay: anime.stagger(100, {start: 500}),
            easing: 'easeOutQuad',
            duration: 600
        });
    }

    // Status indicator animation
    const statusIndicators = document.querySelectorAll('.nn-status-indicator');
    if (statusIndicators.length > 0) {
        anime({
            targets: '.nn-status-indicator',
            opacity: [0, 1],
            scale: [0, 1],
            easing: 'easeOutBack',
            duration: 600,
            delay: 400
        });
    }

    // Operations queue stagger animation
    anime({
        targets: '.nn-op',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100, {start: 2200}),
        easing: 'easeOutQuad',
        duration: 600
    });

    // Field log timeline animation
    anime({
        targets: '.nn-entry',
        opacity: [0, 1],
        translateX: [-15, 0],
        delay: anime.stagger(80, {start: 2500}),
        easing: 'easeOutQuad',
        duration: 500
    });
}

export default initNexusNow;