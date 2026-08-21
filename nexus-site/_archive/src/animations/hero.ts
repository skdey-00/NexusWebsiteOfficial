import gsap from 'gsap';

/**
 * Initialize hero section animations
 */
export function initHeroAnimations(): void {
  // Hero logo
  gsap.from('.hero-logo', {
    scale: 0,
    opacity: 0,
    duration: 1,
    ease: 'back.out(1.7)'
  });

  // Hero title
  gsap.from('.hero-title', {
    y: 50,
    opacity: 0,
    duration: 1,
    delay: 0.5
  });

  // Hero tagline
  gsap.from('.hero-tagline', {
    y: 30,
    opacity: 0,
    duration: 1,
    delay: 1.5
  });

  // Hero CTA buttons
  gsap.from('.hero-cta', {
    y: 30,
    opacity: 0,
    duration: 1,
    delay: 1.8,
    stagger: 0.2
  });
}
