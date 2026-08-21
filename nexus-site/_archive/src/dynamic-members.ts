/**
 * Dynamic Member Loading System — Multiple Departments & Roles Support
 * Loads member data from Supabase and populates website pages dynamically
 */

import {
  getAllMembers,
  getMembersByDepartment,
  getDepartments,
  getRoles,
  type MemberWithDetails,
  type Department,
  type Role
} from './lib/supabase-client';

// ── Configuration ─────────────────────────────────────────

const DEPARTMENT_MAPPING: Record<string, string> = {
  'mechanical': 'Mechanical',
  'electronics': 'Electronics',
  'programming': 'Embedded Coding',
  'image-processing': 'Image Processing & Matlab',
  'management': 'Creative & Management',
};

// ── Member Card Template ────────────────────────────────

function createMemberCardHTML(member: MemberWithDetails, isHead: boolean = false): string {
  const initials = member.name.split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const photoHTML = member.photo_url
    ? `<img src="${member.photo_url}" alt="${member.name}" onerror="this.parentElement.innerHTML='<div class=\\'member-avatar-placeholder\\'>${initials}</div>'">`
    : `<div class="member-avatar-placeholder">${initials}</div>`;

  // Create role badges (multiple roles supported)
  const roleBadges = member.roles && member.roles.length > 0
    ? member.roles.map(r => {
        const isHighRole = r.priority >= 70;
        return `<span class="team-member-role ${isHighRole ? 'role-high' : ''}">${r.display_name}</span>`;
      }).join(' ')
    : '<span class="team-member-role">Member</span>';

  const yearBadge = member.year
    ? `<span class="team-member-year">Year ${member.year}</span>`
    : '';

  // Show all departments
  const deptBadges = member.departments && member.departments.length > 0
    ? member.departments.map(d => `<span class="dept-badge">${d.short_name}</span>`).join(' + ')
    : '<span class="dept-badge">No Dept</span>';

  return `
    <div class="team-card ${isHead ? 'head' : ''}" data-member-id="${member.id}">
        <div class="team-member-avatar">
            ${photoHTML}
        </div>
        <div class="team-member-info">
            <h4 class="team-member-name">${member.name}</h4>
            <div class="team-member-details">
                ${deptBadges}
            </div>
            <div class="team-member-roles">
                ${roleBadges}
            </div>
            ${yearBadge}
        </div>
    </div>
  `;
}

// ── Load Members by Department ────────────────────────────

export async function loadDepartmentMembers(department: string): Promise<{
  members: MemberWithDetails[];
  heads: MemberWithDetails[];
  total: number;
}> {
  try {
    const { supabase } = await import('./lib/supabase-client.js');

    if (!supabase) {
      console.warn('Supabase not configured, using fallback members');
      return getFallbackMembers(department);
    }

    const deptId = department; // Use the short name as ID
    const allMembers = await getAllMembers(false);

    // Filter members who are in this department
    const members = allMembers.filter(m =>
      m.departments?.some(d => d.id === deptId || d.short_name === department)
    );

    const heads = members.filter(m => m.roles?.some(r =>
      r.name === 'head' || r.name === 'captain' || r.name === 'cto' || r.name === 'vice_captain'
    ));

    return {
      members,
      heads,
      total: members.length,
    };
  } catch (err) {
    console.error('Failed to load members:', err);
    return getFallbackMembers(department);
  }
}

// ── Load All Members (for team.html) ───────────────────────

export async function loadAllTeamMembers(): Promise<{
  members: Member[];
  heads: Member[];
  byDepartment: Record<string, Member[]>;
}> {
  try {
    console.log('[loadAllTeamMembers] Starting to load members...');

    const { supabase } = await import('./lib/supabase-client.js');

    console.log('[loadAllTeamMembers] Supabase client:', supabase ? 'available' : 'null');

    if (!supabase) {
      console.warn('[loadAllTeamMembers] Supabase not configured, using fallback members');
      return getFallbackAllMembers();
    }

    const members = await getAllMembers(false); // Only active members (removed won't show)
    console.log('[loadAllTeamMembers] Loaded members from Supabase:', members.length);

    // Group by department (members can be in multiple departments)
    const byDepartment: Record<string, MemberWithDetails[]> = {};
    for (const member of members) {
      if (member.departments) {
        member.departments.forEach(dept => {
          const shortName = getShortDepartmentName(dept.name);
          if (!byDepartment[shortName]) {
            byDepartment[shortName] = [];
          }
          // Add member if not already in this department list
          if (!byDepartment[shortName].find(m => m.id === member.id)) {
            byDepartment[shortName].push(member);
          }
        });
      }
    }

    // Separate heads from regular members (based on roles)
    const heads = members.filter(m => m.roles?.some(r => r.name === 'head' || r.name === 'captain' || r.name === 'cto' || r.name === 'vice_captain'));
    const regularMembers = members.filter(m => m.role !== 'head' && m.role !== 'captain');

    console.log('[loadAllTeamMembers] Found heads:', heads.length, 'byDepartment:', Object.keys(byDepartment));

    return {
      members,
      heads,
      byDepartment,
    };
  } catch (err) {
    console.error('[loadAllTeamMembers] Failed to load all members:', err);
    console.log('[loadAllTeamMembers] Falling back to static data');
    return getFallbackAllMembers();
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
    console.log('[Team Page] Starting to load team members...');
    const result = await loadAllTeamMembers();
    console.log('[Team Page] Loaded team members:', result);

    const { heads, byDepartment } = result;

    let html = '';

    // Add heads section if any
    if (heads && heads.length > 0) {
      html += '<section class="team-section" style="margin-bottom: 60px;">';
      html += '<h2 class="section-title" style="text-align: center; margin-bottom: 32px;">Leadership</h2>';
      html += '<div class="team-grid">';
      heads.forEach(head => {
        html += createMemberCardHTML(head, true);
      });
      html += '</div></section>';
    }

    // Add department sections
    if (byDepartment) {
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
    }

    if (!html) {
      console.warn('[Team Page] No HTML generated, showing empty state');
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <p>No team members found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = html;
    console.log('[Team Page] Successfully populated team page');

  } catch (err) {
    console.error('[Team Page] Failed to populate team page:', err);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load team members. Using fallback data...</p>
      </div>
    `;

    // Fall back to static data after a short delay
    setTimeout(() => {
      const fallback = getFallbackAllMembers();
      let html = '';

      if (fallback.heads && fallback.heads.length > 0) {
        html += '<section class="team-section" style="margin-bottom: 60px;">';
        html += '<h2 class="section-title" style="text-align: center; margin-bottom: 32px;">Leadership</h2>';
        html += '<div class="team-grid">';
        fallback.heads.forEach(head => {
          html += createMemberCardHTML(head, true);
        });
        html += '</div></section>';
      }

      if (fallback.byDepartment) {
        for (const [shortDept, members] of Object.entries(fallback.byDepartment)) {
          if (members.length === 0) continue;

          html += '<section class="team-section" style="margin-bottom: 60px;">';
          html += `<h2 class="section-title">${DEPARTMENT_MAPPING[shortDept] || shortDept}</h2>`;
          html += '<div class="team-grid">';
          members.forEach(member => {
            html += createMemberCardHTML(member, member.role === 'head' || member.role === 'captain');
          });
          html += '</div></section>';
        }
      }

      container.innerHTML = html;
      console.log('[Team Page] Fallback data loaded');
    }, 1000);
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

// ── Fallback Data (when Supabase not configured) ─────────

function getFallbackMembers(department: string) {
  const fallbackData: Record<string, any[]> = {
    mechanical: [
      { name: 'Aryan Nair', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/Aryan Nair.png' },
      { name: 'Rutambhar Gada', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Rutambhar Gada.png' },
      { name: 'Shubham Mehta', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Shubham Mehta.png' },
      { name: 'Sanmeet Dey', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Sanmeet Dey.png' },
    ],
    electronics: [
      { name: 'Aditya Anchan', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/Aditya Anchan.png' },
      { name: 'Paarth Mehta', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Paarth Mehta.png' },
      { name: 'Arpita Bhalekar', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Arpita Bhalekar.png' },
    ],
    programming: [
      { name: 'Mayank Verma', role: 'captain', year: '4', photo_url: '/Images/Team Members Photos/Mayank Verma.png' },
      { name: 'Daksh Mishra', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Daksh Mishra.png' },
      { name: 'Hrishikesh Samant', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Hrishikesh Samant.png' },
      { name: 'Himanshu Chavan', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Himanshu Chavan.png' },
      { name: 'Sonam Sinha', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Sonam Sinha.png' },
    ],
    'image-processing': [
      { name: 'Harsh Sharma', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/Harsh Sharma.png' },
      { name: 'Yash Thakkar', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/Yash Thakkar.png' },
      { name: 'Tashi Shrivastava', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Tashi Shrivastava.png' },
      { name: 'Rohini Vemula', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Rohini Vemula.png' },
      { name: 'Avani Mantri', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Avani Mantri.png' },
      { name: 'Avika Bhagwat', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Avika Bhagwat.png' },
    ],
    management: [
      { name: 'Tanisha Shah', role: 'head', year: '3', photo_url: '/Images/Team Members Photos/Tanisha Shah.png' },
      { name: 'Nidhi Bhatkar', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Nidhi Bhatkar.png' },
      { name: 'S. K. Ukrande', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/S. K. Ukrande.png' },
    ],
  };

  const deptMembers = fallbackData[department] || [];

  return {
    members: deptMembers,
    heads: deptMembers.filter((m: any) => m.role === 'head' || m.role === 'captain'),
    total: deptMembers.length,
  };
}

function getFallbackAllMembers() {
  const allMembers = [
    { name: 'Mayank Verma', role: 'captain', department: 'Embedded Coding', year: '4', photo_url: '/Images/Team Members Photos/Mayank Verma.png' },
    { name: 'Aryan Nair', role: 'head', department: 'Mechanical', year: '4', photo_url: '/Images/Team Members Photos/Aryan Nair.png' },
    { name: 'S. K. Ukrande', role: 'head', department: 'Creative & Management', year: '4', photo_url: '/Images/Team Members Photos/S. K. Ukrande.png' },
    { name: 'Harsh Sharma', role: 'head', department: 'Image Processing & Matlab', year: '4', photo_url: '/Images/Team Members Photos/Harsh Sharma.png' },
    { name: 'Yash Thakkar', role: 'head', department: 'Image Processing & Matlab', year: '4', photo_url: '/Images/Team Members Photos/Yash Thakkar.png' },
    { name: 'Tanisha Shah', role: 'head', department: 'Creative & Management', year: '3', photo_url: '/Images/Team Members Photos/Tanisha Shah.png' },
  ];

  const byDepartment: Record<string, Member[]> = {};
  allMembers.forEach(member => {
    const shortName = getShortDepartmentName(member.department);
    if (!byDepartment[shortName]) {
      byDepartment[shortName] = [];
    }
    byDepartment[shortName].push(member as Member);
  });

  return {
    members: allMembers as Member[],
    heads: allMembers.filter(m => m.role === 'head' || m.role === 'captain') as Member[],
    byDepartment,
  };
}

// ── Export for use in pages ───────────────────────────────

export { createMemberCardHTML };
