/**
 * Local Dynamic Member Loading System
 * Loads member data from localStorage and populates website pages dynamically
 * This version works completely offline without Supabase backend
 */

import {
  getAllMembers,
  getMembersByDepartment,
  type LocalMember
} from './lib/local-members';

// ── Configuration ─────────────────────────────────────────

const DEPARTMENT_MAPPING: Record<string, string> = {
  'mechanical': 'Mechanical',
  'electronics': 'Electronics',
  'programming': 'Embedded Coding',
  'image-processing': 'Image Processing & Matlab',
  'management': 'Creative & Management',
};

// ── Member Card Template ────────────────────────────────

function createMemberCardHTML(member: LocalMember, isHead: boolean = false): string {
  const initials = member.name.split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const photoHTML = member.photo_url
    ? `<img src="${member.photo_url}" alt="${member.name}" onerror="this.parentElement.innerHTML='<div class=\\'member-avatar-placeholder\\'>${initials}</div>'">`
    : `<div class="member-avatar-placeholder">${initials}</div>`;

  const roleBadge = member.role === 'head' || member.role === 'captain'
    ? `<span class="team-member-role">${member.role === 'captain' ? 'Captain' : 'Department Head'}</span>`
    : '';

  const yearBadge = member.year
    ? `<span class="team-member-year">Year ${member.year}</span>`
    : '';

  return `
    <div class="team-card ${isHead ? 'head' : ''}" data-member-id="${member.id}">
        <div class="team-member-avatar">
            ${photoHTML}
        </div>
        <div class="team-member-info">
            <h4 class="team-member-name">${member.name}</h4>
            <div class="team-member-details">
                ${roleBadge}
                ${yearBadge}
            </div>
        </div>
    </div>
  `;
}

// ── Load Members by Department ────────────────────────────

export async function loadDepartmentMembers(department: string): Promise<{
  members: LocalMember[];
  heads: LocalMember[];
  total: number;
}> {
  try {
    const fullDeptName = DEPARTMENT_MAPPING[department] || department;
    const members = getMembersByDepartment(fullDeptName);

    const heads = members.filter(m => m.role === 'head' || m.role === 'captain');

    return {
      members,
      heads,
      total: members.length,
    };
  } catch (err) {
    console.error('Failed to load members:', err);
    return { members: [], heads: [], total: 0 };
  }
}

// ── Load All Members (for team.html) ───────────────────────

export async function loadAllTeamMembers(): Promise<{
  members: LocalMember[];
  heads: LocalMember[];
  byDepartment: Record<string, LocalMember[]>;
}> {
  try {
    const members = getAllMembers();

    // Group by department
    const byDepartment: Record<string, LocalMember[]> = {};
    for (const member of members) {
      const shortName = getShortDepartmentName(member.department);
      if (!byDepartment[shortName]) {
        byDepartment[shortName] = [];
      }
      byDepartment[shortName].push(member);
    }

    // Separate heads from regular members
    const heads = members.filter(m => m.role === 'head' || m.role === 'captain');

    return {
      members,
      heads,
      byDepartment,
    };
  } catch (err) {
    console.error('Failed to load all members:', err);
    return { members: [], heads: [], byDepartment: {} };
  }
}

// ── Populate Department Page ────────────────────────────

export async function populateDepartmentPage(department: string) {
  const container = document.getElementById(`dept-team-container`);
  if (!container) {
    console.warn(`Department container not found for ${department}`);
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading team members...</p>
    </div>
  `;

  try {
    const { members, heads, total } = await loadDepartmentMembers(department);

    if (total === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <p>No team members found for this department.</p>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">
            Add members through the admin dashboard.
          </p>
        </div>
      `;
      return;
    }

    let html = '';

    // Add heads first
    if (heads.length > 0) {
      html += '<div class="team-section-title" style="font-family: Space Grotesk; font-size: 18px; color: var(--accent-primary); margin: 24px 0 16px; text-align: center;">Department Heads</div>';
      html += '<div class="team-grid">';
      heads.forEach(head => {
        html += createMemberCardHTML(head, true);
      });
      html += '</div>';
    }

    // Add regular members
    if (heads.length < total) {
      if (heads.length > 0) {
        html += '<div class="team-section-title" style="font-family: Space Grotesk; font-size: 18px; color: var(--accent-primary); margin: 32px 0 16px; text-align: center;">Team Members</div>';
      }
      html += '<div class="team-grid">';
      members.filter(m => m.role !== 'head' && m.role !== 'captain').forEach(member => {
        html += createMemberCardHTML(member, false);
      });
      html += '</div>';
    }

    container.innerHTML = html;

  } catch (err) {
    console.error('Failed to populate department page:', err);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load team members. Please try again later.</p>
      </div>
    `;
  }
}

// ── Populate Team Page ──────────────────────────────────

export async function populateTeamPage() {
  const container = document.getElementById('team-members-container');
  if (!container) {
    console.warn('Team container not found');
    return;
  }

  container.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading team members...</p>
    </div>
  `;

  try {
    const { heads, byDepartment } = await loadAllTeamMembers();

    let html = '';

    // Add heads section if any
    if (heads.length > 0) {
      html += '<section class="team-section" style="margin-bottom: 60px;">';
      html += '<h2 class="section-title" style="text-align: center; margin-bottom: 32px;">Leadership</h2>';
      html += '<div class="team-grid">';
      heads.forEach(head => {
        html += createMemberCardHTML(head, true);
      });
      html += '</div></section>';
    }

    // Add department sections
    for (const [shortDept, members] of Object.entries(byDepartment)) {
      if (members.length === 0) continue;

      html += '<section class="team-section" style="margin-bottom: 60px;">';
      html += `<h2 class="section-title">${DEPARTMENT_MAPPING[shortDept] || shortDept}</h2>`;
      html += '<div class="team-grid">';
      members.forEach(member => {
        html += createMemberCardHTML(member, member.role === 'head' || member.role === 'captain');
      });
      html += '</div></section>';
    }

    container.innerHTML = html || `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>No team members found.</p>
      </div>
    `;

  } catch (err) {
    console.error('Failed to populate team page:', err);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load team members. Please try again later.</p>
      </div>
    `;
  }
}

// ── Helper Functions ──────────────────────────────────

function getShortDepartmentName(fullName: string): string {
  for (const [short, full] of Object.entries(DEPARTMENT_MAPPING)) {
    if (fullName === full || fullName.includes(full)) {
      return short;
    }
  }
  return fullName.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// ── Export for use in pages ───────────────────────────────

export { createMemberCardHTML };
