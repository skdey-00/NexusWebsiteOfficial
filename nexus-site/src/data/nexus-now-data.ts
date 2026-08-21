/**
 * NEXUS NOW DATA — Live operations feed data
 *
 * Contains current campaign information, operations queue, and field log entries.
 * This data powers the "NEXUS NOW" page showing active operations and ongoing updates.
 *
 * REUSABLE CAMPAIGN ARCHITECTURE:
 * - Supports multiple campaign types (events, competitions, recruitment, etc.)
 * - KYNEX is the current active campaign
 * - Data structure allows easy campaign replacement and archiving
 */

export interface Phase {
  name: string;
  status: 'complete' | 'active' | 'pending';
}

export interface Campaign {
  id: string;
  name?: string;
  title: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
  type?: 'competition' | 'recruitment' | 'event' | 'announcement';
  tagline?: string;
  description?: string;
  date?: string;
  prizePool?: string;
  registrationLink?: string;
  rulebookLink?: string;
  image?: string;
  phase?: string;
  phases?: Phase[];
  competitions?: Competition[];
  parameters?: EventParameter[];
  contacts?: Contact[];
}

export interface Competition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  type: 'sumo' | 'line' | 'other';
  registrationLink?: string;
  rulebookLink?: string;
}

export interface EventParameter {
  label: string;
  value: string;
}

export interface Contact {
  name: string;
  phone: string;
  email?: string;
  role?: string;
}

export interface Operation {
  id: string;
  index: string;
  title: string;
  status: 'ACTIVE' | 'UPCOMING' | 'PLANNING' | 'COMPLETED';
  shortDescription: string;
  expandedDetails?: string;
  date?: string;
  location?: string;
  cta?: { text: string; link: string };
  image?: string;
}

export interface FieldLogEntry {
  date: string;
  title: string;
  description: string;
  images?: string[];
  links?: Array<{ text: string; url: string }>;
}

/**
 * Robocon 2026 Phases — used for internal development tracking
 */
const ROBOCON_2026_PHASES: Phase[] = [
  { name: 'CONCEPT', status: 'complete' },
  { name: 'PROTOTYPE', status: 'complete' },
  { name: 'DEVELOPMENT', status: 'active' },
  { name: 'TESTING', status: 'pending' },
  { name: 'INTEGRATION', status: 'pending' },
  { name: 'COMPETITION', status: 'pending' }
];

/**
 * KYNEX CAMPAIGN — Current Active Event
 * Two robotics competitions: Robo Sumo and Line Following
 */
export const KYNEX_CAMPAIGN: Campaign = {
  id: 'kynex-2025',
  name: 'KYNEX',
  title: 'KYNEX',
  status: 'ACTIVE',
  type: 'competition',
  tagline: 'TWO ROBOTICS COMPETITIONS. ONE EPIC EVENT.',
  description: 'KYNEX brings two distinct robotics battles into one arena. Compete in Robo Sumo or Line Following, or enter both to become the ultimate champion.',
  date: '19 SEPTEMBER',
  prizePool: 'UP TO ₹60,000',
  registrationLink: '#register',
  rulebookLink: '#rulebook',
  competitions: [
    {
      id: 'sumo',
      name: 'ROBO SUMO',
      tagline: 'BUILD. PUSH. DOMINATE.',
      description: 'Heavy mechanical combat where robots push opponents out of the ring. Requires torque, power and strategic engineering.',
      type: 'sumo',
      registrationLink: '#sumo-register',
      rulebookLink: '#sumo-rulebook'
    },
    {
      id: 'line',
      name: 'LINE FOLLOWING',
      tagline: 'DETECT. DECIDE. MOVE.',
      description: 'High-speed precision racing where robots follow complex tracks using sensors. Requires intelligence, speed and accuracy.',
      type: 'line',
      registrationLink: '#line-register',
      rulebookLink: '#line-rulebook'
    }
  ],
  parameters: [
    { label: 'DATE', value: '19 SEPTEMBER' },
    { label: 'PRIZE POOL', value: 'UP TO ₹60,000' },
    { label: 'SINGLE ENTRY', value: '₹900' },
    { label: 'DUAL ENTRY', value: '₹1,700' }
  ],
  contacts: [
    {
      name: 'Paarth Mehta',
      phone: '+91 8169524405',
      role: 'Event Coordinator'
    },
    {
      name: 'Arpita Bhalekar',
      phone: '+91 9321127041',
      role: 'Event Coordinator'
    }
  ]
};

/**
 * Featured campaign — currently KYNEX event
 */
export const FEATURED_CAMPAIGN: Campaign = KYNEX_CAMPAIGN;

/**
 * Robocon 2026 Campaign — Separate ongoing internal project
 * (Not the featured campaign on Nexus Now page)
 */
export const ROBOCON_2026: Campaign = {
  id: 'robocon-2026',
  name: 'ROBOCON',
  title: 'ROBOCON 2026',
  status: 'ACTIVE',
  type: 'competition',
  phase: 'DEVELOPMENT',
  phases: ROBOCON_2026_PHASES,
  image: '/assets/robocon-2026-hero.webp',
  description: 'Active development of our competition robot for Robocon 2026. Our team is currently in the development phase, working on bringing the prototype to life with precision engineering and advanced systems integration.'
};

/**
 * Operations queue — current and upcoming operations
 */
export const OPERATIONS: Operation[] = [
  {
    id: 'kynex-2025',
    index: '01',
    title: 'KYNEX 2025',
    status: 'ACTIVE',
    shortDescription: 'Two robotics competitions in one epic event.',
    expandedDetails: 'KYNEX brings together Robo Sumo and Line Following competitions. Open to all robotics enthusiasts with prizes worth up to ₹60,000.',
    date: '19 September 2025',
    location: 'Somaiya Vidyavihar Campus',
    cta: { text: 'Register Now', link: '#register' }
  },
  {
    id: 'robocon-2026',
    index: '02',
    title: 'ROBOCON 2026',
    status: 'ACTIVE',
    shortDescription: 'Our main competition: development phase active.',
    expandedDetails: 'Active development of our competition robot for Robocon 2026. Currently in development phase, working on prototype realization with precision engineering and advanced systems integration.',
    date: 'March 2026',
    cta: { text: 'View Progress', link: '#' }
  },
  {
    id: 'recruitment-2026',
    index: '03',
    title: 'TEAM RECRUITMENT 2026',
    status: 'PLANNING',
    shortDescription: 'Annual recruitment drive for new team members across all departments.',
    expandedDetails: 'Join the next generation of robotics innovators. We recruit passionate students in Mechanical Systems, Electronics, Embedded Systems, Image Processing, and PR & Marketing.',
    date: 'August 2026',
    cta: { text: 'Stay Updated', link: '#' }
  }
];

/**
 * Field log — chronological updates (ongoing update system)
 */
export const FIELD_LOG: FieldLogEntry[] = [
  {
    date: 'AUG 2025',
    title: 'KYNEX LAUNCH',
    description: 'NEXUS Robotics announces KYNEX — two robotics competitions (Robo Sumo and Line Following) with prizes worth up to ₹60,000. Registration open for all robotics enthusiasts.'
  },
  {
    date: 'JUL 2025',
    title: 'PROTOTYPE VALIDATION SUCCESSFUL',
    description: 'The robot prototype successfully completed all validation tests. Key achievements include: successful autonomous navigation runs, precision manipulation tasks, and robust power management system performance.'
  },
  {
    date: 'JUN 2025',
    title: 'NEW GENERATION TEAM ESTABLISHED',
    description: 'The 2025 team structure has been finalized with leadership appointments across all departments. Core leadership team is now driving the Robocon development phase.'
  },
  {
    date: 'MAY 2025',
    title: 'NEXUS REBRAND COMPLETE',
    description: 'Team successfully rebranded to NEXUS Robotics with new visual identity and enhanced technical capabilities. Brand refresh includes updated engineering aesthetics and streamlined operational structure.'
  }
];

export const NEXUS_NOW_DATA = {
  featuredCampaign: FEATURED_CAMPAIGN,
  kynexCampaign: KYNEX_CAMPAIGN,
  roboconCampaign: ROBOCON_2026,
  operations: OPERATIONS,
  fieldLog: FIELD_LOG
};

export default NEXUS_NOW_DATA;
