/**
 * JOURNEY DATA — the team's milestone archive.
 * Source of truth for both the markup (about.html) and the scroll
 * instrument readout (journey.ts). Keep in sync with about.html.
 */
export interface Milestone {
  year: number;
  index: string;        // e.g. '01'
  title: string;
  status: string;       // instrument readout label
}

export const MILESTONES: Milestone[] = [
  { year: 2010, index: '01', title: 'Team Foundation',      status: 'ARCHIVE_OPEN' },
  { year: 2012, index: '02', title: 'First National Achievement', status: 'ACHIEVEMENT_UNLOCKED' },
  { year: 2019, index: '03', title: 'Best Performance',     status: 'PEAK_PERFORMANCE' },
  { year: 2022, index: '04', title: 'Continued Excellence', status: 'RANK_HELD' },
  { year: 2024, index: '05', title: 'Innovation Push',      status: 'SYSTEMS_EXPANDED' },
  { year: 2025, index: '06', title: 'New Generation',       status: 'REBRANDED_NEXUS' }
];
