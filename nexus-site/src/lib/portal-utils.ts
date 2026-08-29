/**
 * NEXUS ROBOTICS INTERNAL PORTAL
 * Utility Functions
 */

import type { AttendanceSession } from './supabase';

// ============================================================
// TIME/DATE FORMATTING
// ============================================================

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

export function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

// ============================================================
// DATE RANGE HELPERS
// ============================================================

export function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function getDateRangeForFilter(filter: 'today' | 'week' | 'month'): { start: string; end: string } {
  switch (filter) {
    case 'today':
      return getTodayRange();
    case 'week':
      return getWeekRange();
    case 'month':
      return getMonthRange();
    default:
      return getTodayRange();
  }
}

// ============================================================
-- CSV EXPORT
// ============================================================

export function exportAttendanceToCSV(sessions: AttendanceSession[]): void {
  if (sessions.length === 0) {
    alert('No attendance data to export');
    return;
  }

  const headers = ['Date', 'Member Name', 'Department', 'Check In', 'Check Out', 'Total Duration'];

  const rows = sessions.map(session => [
    formatDate(session.check_in),
    session.member_name,
    session.department_name || 'N/A',
    formatTime(session.check_in),
    session.check_out ? formatTime(session.check_out) : '--',
    session.duration_minutes ? formatDuration(session.duration_minutes) : '--'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, `nexus-attendance-${new Date().toISOString().split('T')[0]}.csv`);
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
-- UI HELPERS
// ============================================================

export function showAlert(message: string, type: 'error' | 'success' = 'error'): void {
  const alert = document.createElement('div');
  alert.className = `portal-alert portal-alert-${type}`;
  alert.textContent = message;
  alert.style.display = 'block';

  const container = document.querySelector('.portal-content') || document.body;
  container.insertBefore(alert, container.firstChild);

  setTimeout(() => {
    alert.style.display = 'none';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

export function updateClock(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const updateTime = () => {
    element.textContent = getCurrentTime();
  };

  updateTime();
  setInterval(updateTime, 1000);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================
-- VALIDATION
// ============================================================

export function isValidPIN(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
