import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';

/**
 * Animated counters for achievement numbers and stats
 */
export function animateCounters(): void {
  // Animate both achievement-number and stat-number elements
  const achievementCounters = document.querySelectorAll('.achievement-number');
  const statCounters = document.querySelectorAll('.stat-number');

  // Function to animate a counter
  const animateCounter = (counter: Element) => {
    const target = parseInt(counter.getAttribute('data-target') || '0');
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.ceil(current).toString();
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toString();
      }
    };

    ScrollTrigger.create({
      trigger: counter,
      start: 'top 80%',
      onEnter: () => updateCounter(),
      once: true
    });
  };

  // Animate all achievement counters
  achievementCounters.forEach(animateCounter);

  // For stat counters on homepage, animate immediately after page load
  statCounters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target') || '0');
    gsap.to(counter, {
      innerHTML: target,
      duration: 2,
      snap: { innerHTML: 1 },
      ease: 'power2.out',
      delay: 3 // Start after loader finishes
    });
  });
}
