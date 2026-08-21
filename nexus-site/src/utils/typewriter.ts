import type { TypewriterConfig } from '../types';

/**
 * Creates typewriter effect for tagline
 */
export class TypewriterEffect {
  private phrases: string[];
  private phraseIndex: number;
  private charIndex: number;
  private isDeleting: boolean;
  private element: HTMLElement | null;
  private config: TypewriterConfig;
  private timeoutId: number | null = null;

  constructor(elementId: string, phrases: string[], config?: Partial<TypewriterConfig>) {
    this.phrases = phrases;
    this.phraseIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.element = document.getElementById(elementId);
    this.config = {
      phrases,
      typeSpeed: 100,
      deleteSpeed: 50,
      pauseDuration: 2000,
      ...config
    };
  }

  public start(initialDelay: number = 2500): void {
    setTimeout(() => this.type(), initialDelay);
  }

  public stop(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
  }

  private type(): void {
    if (!this.element) return;

    const currentPhrase = this.phrases[this.phraseIndex];

    if (this.isDeleting) {
      this.element.textContent = currentPhrase.substring(0, this.charIndex - 1);
      this.charIndex--;
    } else {
      this.element.textContent = currentPhrase.substring(0, this.charIndex + 1);
      this.charIndex++;
    }

    let typeSpeed = this.isDeleting ? this.config.deleteSpeed : this.config.typeSpeed;

    if (!this.isDeleting && this.charIndex === currentPhrase.length) {
      typeSpeed = this.config.pauseDuration;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      typeSpeed = 500;
    }

    this.timeoutId = window.setTimeout(() => this.type(), typeSpeed);
  }
}

/**
 * Initialize typewriter effect with default phrases
 */
export function initTypewriter(): TypewriterEffect {
  const phrases = [
    'Representing India at Robocon Since 2010',
    'AIR 5 at National Robocon 2019',
    'Five Departments. One Mission.',
    'This is NEXUS ROBOTICS'
  ];

  return new TypewriterEffect('typewriter', phrases);
}
