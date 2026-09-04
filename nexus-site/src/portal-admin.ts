/**
 * NEXUS ROBOTICS INTERNAL PORTAL
 * Admin Dashboard Controller
 */

import { getSession, logout } from './lib/portal-auth';
import {
  getAllAttendance,
  getTodayStats,
  getDepartments,
  getAllMembers,
  calculateSessions,
  type AttendanceSession
} from './lib/supabase';
import {
  formatDate,
  formatTime,
  formatDuration,
  getDateRangeForFilter,
  exportAttendanceToCSV
} from './lib/portal-utils';

// DOM Elements
const activeCountEl = document.getElementById('active-count') as HTMLDivElement;
const todayCheckInsEl = document.getElementById('today-checkins') as HTMLDivElement;
const todayCheckOutsEl = document.getElementById('today-checkouts') as HTMLDivElement;
const periodFilter = document.getElementById('period-filter') as HTMLSelectElement;
const departmentFilter = document.getElementById('department-filter') as HTMLSelectElement;
const memberFilter = document.getElementById('member-filter') as HTMLSelectElement;
const applyFiltersBtn = document.getElementById('apply-filters') as HTMLButtonElement;
const resetFiltersBtn = document.getElementById('reset-filters') as HTMLButtonElement;
const exportCsvBtn = document.getElementById('export-csv') as HTMLButtonElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const attendanceTableBody = document.getElementById('attendance-table-body') as HTMLTableSectionElement;

// State
let currentSessions: AttendanceSession[] = [];
let allMembers: any[] = [];
let allDepartments: any[] = [];
let currentFilter = {
  period: 'today',
  department: 'all',
  member: 'all'
};

// ============================================================
// UI UPDATES
// ============================================================

function updateStats(stats: { checkIns: number; checkOuts: number; active: number }): void {
  activeCountEl.textContent = stats.active.toString();
  todayCheckInsEl.textContent = stats.checkIns.toString();
  todayCheckOutsEl.textContent = stats.checkOuts.toString();
}

function updateAttendanceTable(sessions: AttendanceSession[]): void {
  if (sessions.length === 0) {
    attendanceTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No attendance data found for selected filters</td>
      </tr>
    `;
    return;
  }

  const html = sessions.map(session => {
    const isActive = !session.check_out;
    return `
      <tr>
        <td>${formatDate(session.check_in)}</td>
        <td>${session.member_name}</td>
        <td>${session.department_name || 'N/A'}</td>
        <td>
          <span class="status-badge ${isActive ? 'active' : 'inactive'}">
            ${isActive ? '● ACTIVE' : '○ OUT'}
          </span>
        </td>
        <td>${formatTime(session.check_in)}</td>
        <td>${session.check_out ? formatTime(session.check_out) : '--'}</td>
        <td>${session.duration_minutes ? formatDuration(session.duration_minutes) : isActive ? 'Active' : '--'}</td>
      </tr>
    `;
  }).join('');

  attendanceTableBody.innerHTML = html;
}

// ============================================================
// FILTER HANDLING
// ============================================================

function populateFilters(): void {
  // Populate departments
  allDepartments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.short_name;
    departmentFilter.appendChild(option);
  });

  // Populate members
  allMembers.forEach(member => {
    const option = document.createElement('option');
    option.value = member.id;
    option.textContent = member.name;
    memberFilter.appendChild(option);
  });
}

async function applyFilters(): Promise<void> {
  currentFilter = {
    period: periodFilter.value,
    department: departmentFilter.value,
    member: memberFilter.value
  };

  await loadAttendanceData();
}

function resetFilters(): void {
  periodFilter.value = 'today';
  departmentFilter.value = 'all';
  memberFilter.value = 'all';
  currentFilter = { period: 'today', department: 'all', member: 'all' };
  applyFilters();
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadStats(): Promise<void> {
  try {
    const stats = await getTodayStats();
    updateStats(stats);
  } catch (error) {
    console.error('[Admin Dashboard] Error loading stats:', error);
  }
}

async function loadAttendanceData(): Promise<void> {
  try {
    let dateRange: { start: string; end: string } | undefined;

    if (currentFilter.period !== 'all') {
      dateRange = getDateRangeForFilter(currentFilter.period as 'today' | 'week' | 'month');
    }

    const events = await getAllAttendance(
      dateRange?.start,
      dateRange?.end,
      currentFilter.department !== 'all' ? currentFilter.department : undefined
    );

    // Calculate sessions
    let sessions = calculateSessions(events);

    // Filter by member if selected
    if (currentFilter.member !== 'all') {
      sessions = sessions.filter(s => s.member_id === currentFilter.member);
    }

    currentSessions = sessions;
    updateAttendanceTable(sessions);

  } catch (error) {
    console.error('[Admin Dashboard] Error loading attendance:', error);
    attendanceTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Error loading attendance data</td>
      </tr>
    `;
  }
}

async function loadFilterData(): Promise<void> {
  try {
    const [departments, members] = await Promise.all([
      getDepartments(),
      getAllMembers(true)
    ]);

    allDepartments = departments;
    allMembers = members;

    populateFilters();

  } catch (error) {
    console.error('[Admin Dashboard] Error loading filter data:', error);
  }
}

// ============================================================
// EXPORT
// ============================================================

function exportToCSV(): void {
  if (currentSessions.length === 0) {
    alert('No data to export for current filters');
    return;
  }

  exportAttendanceToCSV(currentSessions);
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init(): Promise<void> {
  // Check authentication
  const session = getSession();
  if (!session || session.type !== 'admin') {
    window.location.href = '/portal/login.html';
    return;
  }

  // Set up event handlers
  applyFiltersBtn.addEventListener('click', applyFilters);
  resetFiltersBtn.addEventListener('click', resetFilters);
  exportCsvBtn.addEventListener('click', exportToCSV);
  logoutBtn.addEventListener('click', logout);

  // Load initial data
  await Promise.all([
    loadStats(),
    loadFilterData(),
    loadAttendanceData()
  ]);

  // Update stats every 30 seconds
  setInterval(loadStats, 30000);

  console.log('[Admin Dashboard] Initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
