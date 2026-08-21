/**
 * Type definitions for the NEXUS Robotics website
 */

export interface ParticleConfig {
  count: number;
  minDuration: number;
  maxDuration: number;
}

export interface CircuitLineConfig {
  lineCount: number;
  dotCount: number;
}

export interface TypewriterConfig {
  phrases: string[];
  typeSpeed: number;
  deleteSpeed: number;
  pauseDuration: number;
}

export interface NavigationState {
  isMenuOpen: boolean;
  activeSection: string;
}

export interface CounterAnimation {
  target: number;
  duration: number;
  current: number;
}

export interface GSAPAnimationConfig {
  scrollTrigger?: {
    trigger: string | Element;
    start?: string;
    end?: string;
    scrub?: boolean;
    toggleActions?: string;
    once?: boolean;
    onEnter?: () => void;
  };
  duration?: number;
  delay?: number;
  ease?: string;
  [key: string]: any;
}

export interface RobotSpec {
  speed: number;
  precision: number;
  autonomy: number;
  powerEfficiency: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
