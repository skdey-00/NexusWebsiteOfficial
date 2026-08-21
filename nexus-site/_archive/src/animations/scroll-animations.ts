import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Initialize all scroll-triggered animations
 */
export function initScrollAnimations(): void {
  // Section headers
  gsap.utils.toArray('.section-header').forEach((header) => {
    gsap.from(header as Element, {
      scrollTrigger: {
        trigger: header as Element,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      y: 50,
      opacity: 0,
      duration: 1
    });
  });

  // Timeline items
  gsap.utils.toArray<HTMLElement>('.timeline-item').forEach((item, index) => {
    gsap.from(item, {
      scrollTrigger: {
        trigger: item,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      x: index % 2 === 0 ? -50 : 50,
      opacity: 0,
      duration: 1,
      delay: 0
    });
  });

  // Achievement cards
  gsap.utils.toArray('.achievement-card').forEach((card) => {
    gsap.from(card as Element, {
      scrollTrigger: {
        trigger: card as Element,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      delay: 0
    });
  });

  // Robot cards
  gsap.utils.toArray('.robot-card').forEach((card) => {
    gsap.from(card as Element, {
      scrollTrigger: {
        trigger: card as Element,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      y: 100,
      opacity: 0,
      duration: 1,
      delay: 0
    });
  });

  // Department cards
  gsap.utils.toArray('.dept-card').forEach((card) => {
    gsap.from(card as Element, {
      scrollTrigger: {
        trigger: card as Element,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      scale: 0.8,
      opacity: 0,
      duration: 0.8,
      delay: 0
    });
  });

  // Stat items
  gsap.utils.toArray('.stat-item').forEach((item) => {
    gsap.from(item as Element, {
      scrollTrigger: {
        trigger: item as Element,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      scale: 0,
      opacity: 0,
      duration: 0.8,
      delay: 0
    });
  });

  // Contact items
  gsap.utils.toArray('.contact-item').forEach((item) => {
    gsap.from(item as Element, {
      scrollTrigger: {
        trigger: item as Element,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      x: -50,
      opacity: 0,
      duration: 0.8,
      delay: 0
    });
  });
}
