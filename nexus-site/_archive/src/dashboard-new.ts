/**
 * Attendance Dashboard — Real-time lab attendance tracking
 * Shows current members, activity log, and export functionality
 */

import {
  getCurrentMembers,
  getAttendanceSummary,
  getAllScanLogs,
} from './lib/supabase-client';

// ── Types ─────────────────────────────────────────────

interface AttendanceEntry {
  member_name: string;
  scan_type: 'entry' | 'exit';
  scanned_at: string;
  department?: string;
}

// ── DOM Elements ───────────────────────────────────────

const statCurrent = document.getElementById('stat-current') as HTMLElement;
const statToday = document.getElementById('stat-today') as HTMLElement;
const statHours = document.getElementById('stat-hours') as HTMLElement;
const currentCount = document.getElementById('current-count') as HTMLElement;
const currentMembers = document.getElementById('current-members') as HTMLElement;
const logTableBody = document.getElementById('log-table-body') as HTMLElement;
const timeFilters = document.getElementById('time-filters') as HTMLElement;
const exportBtn = document.getElementById('export-btn') as HTMLElement;

// ── State ─────────────────────────────────────────────

let currentFilter: 'today' | 'week' | 'all' = 'today';
let allLogs: AttendanceEntry[] = [];
let refreshInterval: number | null = null;

// ── Time Formatting ───────────────────────────────────

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getEntryTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Date Filtering ───────────────────────────────────

function getFilterDates() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  return { todayStart, weekStart, now };
}

function filterLogs(logs: AttendanceEntry[]): AttendanceEntry[] {
  const { todayStart, weekStart } = getFilterDates();

  switch (currentFilter) {
    case 'today':
      return logs.filter((log) => new Date(log.scanned_at) >= todayStart);
    case 'week':
      return logs.filter((log) => new Date(log.scanned_at) >= weekStart);
    case 'all':
    default:
      return logs;
  }
}

// ── UI Rendering ──────────────────────────────────────

async function renderCurrentMembers() {
  try {
    const members = await getCurrentMembers();

    if (members.length === 0) {
      currentMembers.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-door-open"></i>
          <p>No members currently in the lab</p>
        </div>
      `;
      currentCount.textContent = '0';
      statCurrent.textContent = '0';
      return;
    }

    currentCount.textContent = String(members.length);
    statCurrent.textContent = String(members.length);

    currentMembers.innerHTML = members.map((member: any) => {
      const entryTime = member.last_scan
        ? getEntryTime(member.last_scan.scanned_at)
        : '—';

      return `
        <div class="member-card">
          <div class="member-avatar">${getInitials(member.name)}</div>
          <div class="member-info">
            <div class="member-name">${member.name}</div>
            <div class="member-dept">${member.department}</div>
          </div>
          <div class="member-time">
            <i class="fas fa-clock"></i> ${entryTime}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading current members:', err);
    currentMembers.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load current members</p>
      </div>
    `;
  }
}

async function renderStats() {
  try {
    const { todayStart } = getFilterDates();
    const summary = await getAttendanceSummary(todayStart, new Date());

    statToday.textContent = String(summary.total_entries);
    statHours.textContent = summary.total_duration_hours.toFixed(1);
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function renderActivityLog() {
  try {
    const logs = await getAllScanLogs(100);
    allLogs = logs.map((log: any) => ({
      member_name: log.members?.name || 'Unknown',
      scan_type: log.scan_type,
      scanned_at: log.scanned_at,
      department: log.members?.department,
    }));

    const filteredLogs = filterLogs(allLogs);

    if (filteredLogs.length === 0) {
      logTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <p>No attendance records for this time period</p>
          </td>
        </tr>
      `;
      return;
    }

    logTableBody.innerHTML = filteredLogs.map((log) => `
      <tr>
        <td>${formatTime(log.scanned_at)}</td>
        <td>${log.member_name}</td>
        <td>${log.department || '—'}</td>
        <td>
          <span class="log-badge ${log.scan_type}">
            ${log.scan_type === 'entry' ? 'ENTRY' : 'EXIT'}
          </span>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading activity log:', err);
    logTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load activity log</p>
        </td>
      </tr>
    `;
  }
}

async function renderAll() {
  await Promise.all([
    renderCurrentMembers(),
    renderStats(),
    renderActivityLog(),
  ]);
}

// ── Export CSV ────────────────────────────────────────

function exportToCSV() {
  const filteredLogs = filterLogs(allLogs);

  if (filteredLogs.length === 0) {
    alert('No data to export for this time period');
    return;
  }

  // Create CSV header
  const headers = ['Time', 'Name', 'Department', 'Action'];
  const csvRows = [headers.join(',')];

  // Add data rows
  filteredLogs.forEach((log) => {
    const row = [
      formatTime(log.scanned_at),
      `"${log.member_name}"`,
      `"${log.department || ''}"`,
      log.scan_type.toUpperCase(),
    ];
    csvRows.push(row.join(','));
  });

  // Create downloadable file
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `robocon-attendance-${currentFilter}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ── Event Listeners ───────────────────────────────────

// Time filter buttons
timeFilters.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('filter-btn')) {
    // Update active state
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    target.classList.add('active');

    // Update filter and re-render
    currentFilter = (target as HTMLButtonElement).dataset.filter as 'today' | 'week' | 'all';
    renderActivityLog();
  }
});

// Export button
exportBtn.addEventListener('click', exportToCSV);

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks?.classList.toggle('active');
});

// ── Auto Refresh ──────────────────────────────────────

function startAutoRefresh() {
  // Refresh every 30 seconds
  refreshInterval = window.setInterval(() => {
    renderAll();
  }, 30000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// ── Init ─────────────────────────────────────────────

renderAll();
startAutoRefresh();

// Cleanup on page unload
window.addEventListener('beforeunload', stopAutoRefresh);
