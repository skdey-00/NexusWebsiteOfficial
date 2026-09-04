/**
 * NEXUS ROBOTICS INTERNAL PORTAL
 * Member Dashboard Controller
 */

import { getSession, logout } from './lib/portal-auth';
import { getMemberAttendance, type Member } from './lib/supabase';
import { formatTime, formatDate, formatDuration } from './lib/portal-utils';

// DOM Elements
const memberNameEl = document.getElementById('member-name') as HTMLDivElement;
const memberDeptEl = document.getElementById('member-dept') as HTMLDivElement;
const memberRoleEl = document.getElementById('member-role') as HTMLDivElement;
const statusDot = document.getElementById('status-dot') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLDivElement;
const mainStatusDot = document.getElementById('main-status-dot') as HTMLDivElement;
const mainStatusText = document.getElementById('main-status-text') as HTMLDivElement;
const todayCheckInEl = document.getElementById('today-check-in') as HTMLDivElement;
const todayCheckOutEl = document.getElementById('today-check-out') as HTMLDivElement;
const currentDurationEl = document.getElementById('current-duration') as HTMLDivElement;
const activityTableBody = document.getElementById('activity-table-body') as HTMLTableSectionElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

// State
let currentMember: Member | null = null;
let isActive = false;
let durationUpdateInterval: number | null = null;

// ============================================================
// UI UPDATES
// ============================================================

function updateMemberInfo(member: Member): void {
  currentMember = member;
  memberNameEl.textContent = member.name;

  const primaryDept = member.departments?.[0];
  memberDeptEl.textContent = primaryDept ? primaryDept.name : 'Member';

  const primaryRole = member.roles?.[0];
  memberRoleEl.textContent = primaryRole ? primaryRole.display_name : 'Member';
}

function updateStatus(active: boolean): void {
  isActive = active;

  if (active) {
    statusDot.classList.add('active');
    mainStatusDot.classList.add('active');
    statusText.textContent = '● IN WORKSHOP';
    mainStatusText.textContent = '● IN WORKSHOP';
    statusText.style.color = 'var(--accent-primary)';
    mainStatusText.style.color = 'var(--accent-primary)';
  } else {
    statusDot.classList.remove('active');
    mainStatusDot.classList.remove('active');
    statusText.textContent = '○ OUTSIDE';
    mainStatusText.textContent = '○ OUTSIDE';
    statusText.style.color = 'var(--text-muted)';
    mainStatusText.style.color = 'var(--text-muted)';
  }
}

function updateTodaySession(todayEvents: any[]): void {
  if (todayEvents.length === 0) {
    todayCheckInEl.textContent = '--';
    todayCheckOutEl.textContent = '--';
    currentDurationEl.textContent = '--';
    currentDurationEl.classList.add('empty');
    return;
  }

  // Find first check-in of today
  const firstCheckIn = todayEvents.find((e: any) => e.event_type === 'IN');
  const lastCheckOut = [...todayEvents].reverse().find((e: any) => e.event_type === 'OUT');

  todayCheckInEl.textContent = firstCheckIn ? formatTime(firstCheckIn.timestamp) : '--';
  todayCheckOutEl.textContent = lastCheckOut ? formatTime(lastCheckOut.timestamp) : '--';
  todayCheckOutEl.classList.toggle('empty', !lastCheckOut);

  if (isActive) {
    // Calculate current duration
    updateCurrentDuration(firstCheckIn?.timestamp);
  } else {
    currentDurationEl.textContent = '--';
    currentDurationEl.classList.add('empty');
    if (durationUpdateInterval) {
      clearInterval(durationUpdateInterval);
      durationUpdateInterval = null;
    }
  }
}

function updateCurrentDuration(checkInTime?: string): void {
  if (!checkInTime || !isActive) {
    currentDurationEl.textContent = '--';
    currentDurationEl.classList.add('empty');
    return;
  }

  const updateDuration = () => {
    const now = new Date();
    const checkIn = new Date(checkInTime);
    const minutes = Math.floor((now.getTime() - checkIn.getTime()) / 60000);
    currentDurationEl.textContent = formatDuration(minutes);
    currentDurationEl.classList.remove('empty');
  };

  updateDuration();

  // Update every minute
  if (durationUpdateInterval) {
    clearInterval(durationUpdateInterval);
  }
  durationUpdateInterval = window.setInterval(updateDuration, 60000);
}

function updateActivityTable(events: any[]): void {
  if (events.length === 0) {
    activityTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No recent activity</td>
      </tr>
    `;
    return;
  }

  // Group events into sessions
  const sessions: any[] = [];
  let currentSession: any = null;

  // Sort events by timestamp ascending
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const event of sortedEvents) {
    if (event.event_type === 'IN') {
      currentSession = {
        date: event.timestamp,
        checkIn: event.timestamp,
        checkOut: null,
        duration: null
      };
    } else if (event.event_type === 'OUT' && currentSession) {
      currentSession.checkOut = event.timestamp;
      currentSession.duration = Math.round(
        (new Date(currentSession.checkOut).getTime() - new Date(currentSession.checkIn).getTime()) / 60000
      );
      sessions.push(currentSession);
      currentSession = null;
    }
  }

  // Handle unclosed sessions (forgot to check out)
  if (currentSession) {
    sessions.push(currentSession);
  }

  // Render sessions (most recent first)
  const html = sessions.reverse().map(session => `
    <tr>
      <td>${formatDate(session.date)}</td>
      <td>${formatTime(session.checkIn)}</td>
      <td>${session.checkOut ? formatTime(session.checkOut) : '<span style="color: var(--text-muted);">--</span>'}</td>
      <td>${session.duration ? formatDuration(session.duration) : '<span style="color: var(--text-muted);">Active</span>'}</td>
    </tr>
  `).join('');

  activityTableBody.innerHTML = html;
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init(): Promise<void> {
  // Check authentication
  const session = getSession();
  if (!session || session.type !== 'member') {
    window.location.href = '/portal/login.html';
    return;
  }

  currentMember = session.user as Member;

  // Update member info
  updateMemberInfo(currentMember);

  // Load attendance data
  try {
    const events = await getMemberAttendance(currentMember.id, 100);

    if (events.length > 0) {
      // Determine current status from most recent event
      const latestEvent = events[0];
      const active = latestEvent.event_type === 'IN';
      updateStatus(active);

      // Get today's events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayEvents = events.filter((e: any) => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= today && eventDate < tomorrow;
      });

      updateTodaySession(todayEvents);
    } else {
      updateStatus(false);
      updateTodaySession([]);
    }

    updateActivityTable(events);

  } catch (error) {
    console.error('[Member Dashboard] Error loading attendance:', error);
    updateStatus(false);
    activityTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Unable to load activity data</td>
      </tr>
    `;
  }

  // Set up logout handler
  logoutBtn.addEventListener('click', logout);

  console.log('[Member Dashboard] Initialized for:', currentMember.name);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (durationUpdateInterval) {
    clearInterval(durationUpdateInterval);
  }
});
