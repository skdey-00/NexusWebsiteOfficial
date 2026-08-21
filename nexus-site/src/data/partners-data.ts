/**
 * PARTNER DATA — the Nexus network (sponsors page).
 *
 * Single source of truth for the PARTNER ARCHIVE. Adding a partner is
 * data-only: add one Partner entry and the archive renders it.
 *
 * HONESTY RULE: `classification` is either verified from the partner's
 * public identity (what the company demonstrably is/does) or a neutral
 * network classification. `note` is optional and only used where the
 * company's own public description is unambiguous. NO contribution
 * amounts, NO invented partnership details.
 */

export type PartnerClass =
  | 'FINANCIAL PARTNER'
  | 'MATERIAL PARTNER'
  | 'TECHNOLOGY PARTNER'
  | 'ENGINEERING PARTNER'
  | 'STRATEGIC PARTNER'
  | 'NETWORK PARTNER';

export interface Partner {
  /** file under /Images/Sponsers list/ (path has the historical misspelling) */
  logo: string;
  name: string;
  classification: PartnerClass;
  /** optional one-line note — ONLY where public identity is unambiguous */
  note?: string;
  /** verified external link or null (never fabricated) */
  url: string | null;
  /** archive choreography: composition slot for visual variety */
  slot: 'wide' | 'tall' | 'standard' | 'standard-alt';
}

export const PARTNERS: Partner[] = [
  // --- computation & design software ---
  {
    logo: 'MATLAB_Logo.png',
    name: 'MATLAB',
    classification: 'TECHNOLOGY PARTNER',
    note: 'Computation and simulation software.',
    url: 'https://in.mathworks.com/',
    slot: 'wide',
  },
  {
    logo: 'Solidworks logo.png',
    name: 'SOLIDWORKS',
    classification: 'TECHNOLOGY PARTNER',
    note: '3D mechanical CAD.',
    url: 'https://www.solidworks.com/',
    slot: 'wide',
  },
  // --- PCB fabrication ---
  {
    logo: 'JLC_PCB.png',
    name: 'JLCPCB',
    classification: 'MATERIAL PARTNER',
    note: 'Printed circuit board fabrication.',
    url: 'https://jlcpcb.com/',
    slot: 'standard',
  },
  {
    logo: 'PCBWay.png',
    name: 'PCBWAY',
    classification: 'MATERIAL PARTNER',
    note: 'Printed circuit board fabrication.',
    url: 'https://www.pcbway.com/',
    slot: 'standard',
  },
  // --- prototyping & manufacturing ---
  {
    logo: 'Malkar_Industries.png',
    name: 'MALKAR INDUSTRIES',
    classification: 'ENGINEERING PARTNER',
    note: 'Precision machining.',
    url: 'https://malkar.in/',
    slot: 'standard-alt',
  },
  {
    logo: 'ICS_Designs.png',
    name: 'ICS DESIGNS',
    classification: 'ENGINEERING PARTNER',
    url: 'https://www.icsdesigns.in/',
    slot: 'standard-alt',
  },
  {
    logo: 'Eonix.png',
    name: 'EONIX SYSTEMS',
    classification: 'ENGINEERING PARTNER',
    url: 'https://www.eonixsystems.com/',
    slot: 'standard-alt',
  },
  // --- components & hardware ---
  {
    logo: 'ODrive.png',
    name: 'ODRIVE',
    classification: 'TECHNOLOGY PARTNER',
    note: 'Motor control electronics.',
    url: 'https://odriverobotics.com/',
    slot: 'wide',
  },
  {
    logo: 'Benewake.png',
    name: 'BENEWAKE',
    classification: 'TECHNOLOGY PARTNER',
    note: 'LiDAR sensing.',
    url: 'https://en.benewake.com/',
    slot: 'standard',
  },
  {
    logo: 'SICK.png',
    name: 'SICK',
    classification: 'TECHNOLOGY PARTNER',
    note: 'Industrial sensors.',
    url: null,
    slot: 'standard',
  },
  {
    logo: 'Mercury_Pneumatics.png',
    name: 'MERCURY PNEUMATICS',
    classification: 'MATERIAL PARTNER',
    note: 'Pneumatic systems.',
    url: 'https://www.mercuryindia.net/',
    slot: 'standard',
  },
  {
    logo: 'Pankaj.png',
    name: 'PANKAJ',
    classification: 'MATERIAL PARTNER',
    note: 'Potentiometers.',
    url: null,
    slot: 'standard',
  },
  {
    logo: 'Paxshell.png',
    name: 'PAXSHELL',
    classification: 'NETWORK PARTNER',
    url: null,
    slot: 'standard',
  },
  // --- ecosystem ---
  {
    logo: 'Riidl.png',
    name: 'RIIDL',
    classification: 'STRATEGIC PARTNER',
    note: 'Innovation ecosystem support.',
    url: null,
    slot: 'standard',
  },
  {
    logo: 'NBT.png',
    name: 'NBT',
    classification: 'NETWORK PARTNER',
    url: null,
    slot: 'standard',
  },
];

export const TOTAL_PARTNERS = PARTNERS.length;
