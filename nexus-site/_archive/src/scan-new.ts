/**
 * Scan Toggle Logic — Auto entry/exit based on last scan
 * When member opens this page, it toggles their attendance state
 */

import { getLastScan, createScanLog, getMemberById } from './lib/supabase-client';

// ── Demo Mode (for testing without Supabase) ─────────────

const DEMO_MODE = false; // Set to true for testing without database

// Simulated scan storage for demo mode
const DEMO_SCANS: Record<string, Array<{ type: 'entry' | 'exit'; time: string }>> = {};

// ── Constants ─────────────────────────────────────────────

const MEMBER_ID_KEY = 'robocon_member_id';
const MEMBER_NAME_KEY = 'robocon_member_name';
const MEMBER_DEPT_KEY = 'robocon_member_dept';

// ── DOM Elements ─────────────────────────────────────────

const loadingCard = document.getElementById('loading-card') as HTMLDivElement;
const resultCard = document.getElementById('result-card') as HTMLDivElement;
const errorCard = document.getElementById('error-card') as HTMLDivElement;

const resultIcon = document.getElementById('result-icon') as HTMLElement;
const resultTitle = document.getElementById('result-title') as HTMLElement;
const resultMember = document.getElementById('result-member') as HTMLElement;
const resultDept = document.getElementById('result-dept') as HTMLElement;
const resultTime = document.getElementById('result-time') as HTMLElement;
const resultDuration = document.getElementById('result-duration') as HTMLElement;
const resultMessage = document.getElementById('result-message') as HTMLElement;
const closeBtn = document.getElementById('close-btn') as HTMLButtonElement;

// ── Session Check ────────────────────────────────────────

function getMemberSession() {
  const id = localStorage.getItem(MEMBER_ID_KEY);
  const name = localStorage.getItem(MEMBER_NAME_KEY);
  const dept = localStorage.getItem(MEMBER_DEPT_KEY);

  if (!id || !name) return null;

  return { id, name, dept: dept || 'Team Member' };
}

// ── Time Formatting ───────────────────────────────────────

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ── Show States ───────────────────────────────────────────

function showLoading() {
  loadingCard.style.display = 'block';
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';
}

function showEntryResult(member: any, scanTime: string) {
  loadingCard.style.display = 'none';
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';

  resultCard.className = 'result-card entry';
  resultIcon.className = 'fas fa-right-to-bracket result-icon entry';
  resultTitle.className = 'result-title entry';
  resultTitle.textContent = 'ENTRY';

  resultMember.textContent = member.name;
  resultDept.textContent = member.department;
  resultTime.textContent = formatTimestamp(scanTime);
  resultDuration.style.display = 'none';
  resultMessage.textContent = 'Welcome to the lab! Have a productive session.';

  resultCard.style.display = 'block';

  // Vibrate if supported
  if (navigator.vibrate) {
    navigator.vibrate([100]);
  }
}

function showExitResult(member: any, scanTime: string, lastEntryTime: string) {
  loadingCard.style.display = 'none';
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';

  resultCard.className = 'result-card exit';
  resultIcon.className = 'fas fa-right-from-bracket result-icon exit';
  resultTitle.className = 'result-title exit';
  resultTitle.textContent = 'EXIT';

  resultMember.textContent = member.name;
  resultDept.textContent = member.department;
  resultTime.textContent = formatTimestamp(scanTime);
  resultDuration.style.display = 'block';
  resultDuration.textContent = `Session: ${formatDuration(lastEntryTime, scanTime)}`;
  resultMessage.textContent = 'See you next time! Great work today.';

  resultCard.style.display = 'block';

  // Vibrate if supported
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

function showError() {
  loadingCard.style.display = 'none';
  resultCard.style.display = 'none';
  errorCard.style.display = 'block';
}

// ── Toggle Logic ─────────────────────────────────────────

async function processScan() {
  const session = getMemberSession();

  if (!session) {
    showError();
    return;
  }

  try {
    let member: any;
    let lastScan: any;
    let scanType: 'entry' | 'exit';
    let resultScan: any;

    if (DEMO_MODE) {
      // Demo mode: Simulate member and scan logic
      member = {
        id: session.id,
        name: session.name,
        department: session.dept,
      };

      // Get simulated last scan
      const memberScans = DEMO_SCANS[session.id] || [];
      lastScan = memberScans.length > 0 ? memberScans[memberScans.length - 1] : null;

      // Determine scan type
      if (!lastScan || lastScan.type === 'exit') {
        scanType = 'entry';
      } else {
        scanType = 'exit';
      }

      // Create new scan record
      const newScan = { type: scanType, time: new Date().toISOString() };
      if (!DEMO_SCANS[session.id]) {
        DEMO_SCANS[session.id] = [];
      }
      DEMO_SCANS[session.id].push(newScan);
      resultScan = { scanned_at: newScan.time };

    } else {
      // Normal mode: Use Supabase
      const { supabase } = await import('./lib/supabase-client.js');
      if (!supabase) {
        throw new Error('SUPABASE_NOT_CONFIGURED');
      }

      // Get member details
      member = await getMemberById(session.id);
      if (!member) {
        localStorage.clear();
        showError();
        return;
      }

      // Get last scan to determine toggle
      lastScan = await getLastScan(session.id);

      if (!lastScan) {
        // No previous scan → this is an ENTRY
        scanType = 'entry';
        resultScan = await createScanLog(session.id, scanType);
      } else if (lastScan.scan_type === 'exit') {
        // Last was exit → this is an ENTRY
        scanType = 'entry';
        resultScan = await createScanLog(session.id, scanType);
      } else {
        // Last was entry → this is an EXIT
        scanType = 'exit';
        resultScan = await createScanLog(session.id, scanType);
      }
    }

    // Show results
    if (scanType === 'entry') {
      showEntryResult(member, resultScan.scanned_at);
    } else {
      const lastEntryTime = lastScan?.scanned_at || resultScan.scanned_at;
      showExitResult(member, resultScan.scanned_at, lastEntryTime);
    }

  } catch (err: any) {
    console.error('Scan error:', err);

    if (err.message === 'SUPABASE_NOT_CONFIGURED') {
      loadingCard.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size:48px; color:#ef4444; margin-bottom:24px; display:block;"></i>
        <h2 style="font-family:'Space Grotesk'; font-size:20px; color:var(--text-primary); margin-bottom:8px;">SYSTEM NOT CONFIGURED</h2>
        <p style="font-family:'Manrope'; font-size:14px; color:var(--text-muted);">Please set up Supabase credentials. See SETUP_GUIDE.md for instructions.</p>
        <div style="display:flex; gap:12px; margin-top:24px;">
          <a href="SETUP_GUIDE.md" target="_blank" class="action-btn primary" style="flex:1; padding:14px 24px; border-radius:12px; border:none; background:linear-gradient(135deg, #991b1b, #dc2626); color:white; font-family:'Space Grotesk'; font-size:14px; font-weight:600; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; justify-content:center;">
            <i class="fas fa-book"></i> Setup Guide
          </a>
          <a href="portal.html" class="action-btn secondary" style="flex:1; padding:14px 24px; border-radius:12px; border:1px solid var(--border-light); background:var(--primary-bg); color:var(--text-secondary); font-family:'Space Grotesk'; font-size:14px; font-weight:600; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; justify-content:center;">
            <i class="fas fa-arrow-right-to-bracket"></i> Portal
          </a>
        </div>
      `;
    } else {
      loadingCard.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size:48px; color:#ef4444; margin-bottom:24px; display:block;"></i>
        <h2 style="font-family:'Space Grotesk'; font-size:20px; color:var(--text-primary); margin-bottom:8px;">ERROR</h2>
        <p style="font-family:'Manrope'; font-size:14px; color:var(--text-muted);">Failed to record attendance. Please check your connection and try again.</p>
        <div style="display:flex; gap:12px; margin-top:24px;">
          <button onclick="location.reload()" class="action-btn primary" style="flex:1; padding:14px 24px; border-radius:12px; border:none; background:linear-gradient(135deg, #991b1b, #dc2626); color:white; font-family:'Space Grotesk'; font-size:14px; font-weight:600; cursor:pointer;">
            <i class="fas fa-redo"></i> Try Again
          </button>
          <a href="portal.html" class="action-btn secondary" style="flex:1; padding:14px 24px; border-radius:12px; border:1px solid var(--border-light); background:var(--primary-bg); color:var(--text-secondary); font-family:'Space Grotesk'; font-size:14px; font-weight:600; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; justify-content:center;">
            <i class="fas fa-arrow-right-to-bracket"></i> Portal
          </a>
        </div>
      `;
    }
  }
}

// ── Event Listeners ───────────────────────────────────────

closeBtn.addEventListener('click', () => {
  // Close the tab/window
  window.close();
  // Fallback: show a message
  closeBtn.innerHTML = '<i class="fas fa-check"></i> You can close this tab now';
});

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks?.classList.toggle('active');
});

// ── Init ─────────────────────────────────────────────────

// Start processing immediately
processScan();
