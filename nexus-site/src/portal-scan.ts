/**
 * NEXUS ROBOTICS INTERNAL PORTAL
 * Workshop Attendance Terminal Controller
 */

import { getSession } from './lib/portal-auth';
import {
  getLastAttendanceEvent,
  createAttendanceEvent,
  type Member
} from './lib/supabase';
import {
  getCurrentTime,
  getCurrentDate,
  updateClock
} from './lib/portal-utils';

// DOM Elements
const memberNameEl = document.getElementById('member-name') as HTMLDivElement;
const memberDeptEl = document.getElementById('member-dept') as HTMLDivElement;
const statusDot = document.getElementById('status-dot') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLDivElement;
const checkInBtn = document.getElementById('check-in-btn') as HTMLButtonElement;
const checkOutBtn = document.getElementById('check-out-btn') as HTMLButtonElement;
const warningAlert = document.getElementById('warning-alert') as HTMLDivElement;
const errorAlert = document.getElementById('error-alert') as HTMLDivElement;
const successAlert = document.getElementById('success-alert') as HTMLDivElement;

// State
let currentMember: Member | null = null;
let lastEvent: any = null;
let isActive = false;

// ============================================================
// ALERT MESSAGES
// ============================================================

function showWarning(message: string): void {
  warningAlert.textContent = message;
  warningAlert.classList.add('show');
  errorAlert.classList.remove('show');
  successAlert.classList.remove('show');

  setTimeout(() => {
    warningAlert.classList.remove('show');
  }, 5000);
}

function showError(message: string): void {
  errorAlert.textContent = message;
  errorAlert.classList.add('show');
  warningAlert.classList.remove('show');
  successAlert.classList.remove('show');

  setTimeout(() => {
    errorAlert.classList.remove('show');
  }, 5000);
}

function showSuccess(message: string): void {
  successAlert.textContent = message;
  successAlert.classList.add('show');
  warningAlert.classList.remove('show');
  errorAlert.classList.remove('show');

  setTimeout(() => {
    successAlert.classList.remove('show');
  }, 3000);
}

function clearAlerts(): void {
  warningAlert.classList.remove('show');
  errorAlert.classList.remove('show');
  successAlert.classList.remove('show');
}

// ============================================================
// UI UPDATES
// ============================================================

function updateMemberInfo(member: Member): void {
  currentMember = member;
  memberNameEl.textContent = member.name;

  const primaryDept = member.departments?.[0];
  memberDeptEl.textContent = primaryDept ? primaryDept.short_name : 'MEMBER';
}

function updateStatus(): void {
  if (isActive) {
    statusDot.classList.add('active');
    statusDot.classList.remove('inactive');
    statusText.textContent = 'IN WORKSHOP';
    statusText.style.color = 'var(--accent-primary)';
  } else {
    statusDot.classList.remove('active');
    statusDot.classList.add('inactive');
    statusText.textContent = 'OUTSIDE';
    statusText.style.color = 'var(--text-muted)';
  }
}

function updateButtons(): void {
  // Enable/disable buttons based on current status
  if (isActive) {
    checkInBtn.disabled = true;
    checkOutBtn.disabled = false;
  } else {
    checkInBtn.disabled = false;
    checkOutBtn.disabled = true;
  }
}

function setButtonLoading(loading: boolean): void {
  checkInBtn.disabled = loading || (isActive ? true : false);
  checkOutBtn.disabled = loading || (isActive ? false : true);
}

// ============================================================
// ATTENDANCE ACTIONS
// ============================================================

async function checkIn(): Promise<void> {
  if (!currentMember) {
    showError('Identity verification required');
    return;
  }

  if (isActive) {
    showWarning('ACTIVE SESSION DETECTED — Already checked in');
    return;
  }

  clearAlerts();
  setButtonLoading(true);

  try {
    const event = await createAttendanceEvent(currentMember.id, 'IN');
    lastEvent = event;
    isActive = true;
    updateStatus();
    updateButtons();

    showSuccess(`Checked in at ${getCurrentTime()}`);

  } catch (error) {
    console.error('[Scan Terminal] Check-in error:', error);
    showError('System error: Unable to record check-in');
  } finally {
    setButtonLoading(false);
  }
}

async function checkOut(): Promise<void> {
  if (!currentMember) {
    showError('Identity verification required');
    return;
  }

  if (!isActive) {
    showWarning('NO ACTIVE SESSION — Cannot check out');
    return;
  }

  clearAlerts();
  setButtonLoading(true);

  try {
    const event = await createAttendanceEvent(currentMember.id, 'OUT');
    lastEvent = event;
    isActive = false;
    updateStatus();
    updateButtons();

    showSuccess(`Checked out at ${getCurrentTime()}`);

  } catch (error) {
    console.error('[Scan Terminal] Check-out error:', error);
    showError('System error: Unable to record check-out');
  } finally {
    setButtonLoading(false);
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init(): Promise<void> {
  // Check authentication
  const session = getSession();
  if (!session || session.type !== 'member') {
    // Redirect to login with return to scan
    sessionStorage.setItem('nexus_portal_redirect', window.location.pathname);
    window.location.href = '/portal/login.html';
    return;
  }

  currentMember = session.user as Member;

  // Update member info
  updateMemberInfo(currentMember);

  // Get last attendance event
  try {
    lastEvent = await getLastAttendanceEvent(currentMember.id);

    if (lastEvent) {
      isActive = lastEvent.event_type === 'IN';
    } else {
      isActive = false;
    }

    updateStatus();
    updateButtons();

  } catch (error) {
    console.error('[Scan Terminal] Error loading attendance:', error);
    showError('Unable to load attendance status');
  }

  // Set up button handlers
  checkInBtn.addEventListener('click', checkIn);
  checkOutBtn.addEventListener('click', checkOut);

  // Update clock
  document.getElementById('terminal-date')!.textContent = getCurrentDate();
  updateClock('terminal-time');

  // Logout button (optional - long press or special combination)
  console.log('[Scan Terminal] Initialized for:', currentMember.name);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
