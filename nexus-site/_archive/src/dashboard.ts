/**
 * Dashboard page logic — timesheet, universal QR, and head-only management.
 */
import {
  requireAuth, clearAuth, isHead,
  getTimesheets, updateTimesheet, deleteTimesheet,
  getTimesheetSummary, getUniversalQR, getMembers, registerMember,
  formatDateTime, formatDuration,
  type TimesheetEntry,
} from './api';

const user = requireAuth();
const head = isHead();

// ── Setup header ──────────────────────────────────────

const greeting = document.getElementById('user-greeting');
if (greeting) greeting.textContent = `Welcome, ${user.full_name || user.username}`;

const subtitle = document.getElementById('user-subtitle');
if (subtitle) subtitle.textContent = `@${user.username} • ${user.department}`;

const roleBadge = document.getElementById('role-badge');
if (roleBadge) {
  roleBadge.textContent = head ? 'HEAD' : 'MEMBER';
  roleBadge.classList.add(head ? 'head' : 'member');
}

// Show head-only elements
if (head) {
  document.querySelectorAll('.head-only').forEach((el) => {
    (el as HTMLElement).style.display = '';
  });
  document.getElementById('ts-title')!.textContent = 'All Timesheets';
  document.getElementById('th-user')!.textContent = 'Member';
}

// Logout
document.getElementById('logout-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
  window.location.href = 'login.html';
});

// ── Tab switching ─────────────────────────────────────

const tabs = document.querySelectorAll<HTMLElement>('.dash-tab');
const panels = document.querySelectorAll<HTMLElement>('.dash-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.panel!;
    tabs.forEach((t) => t.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${target}-panel`)?.classList.add('active');
  });
});

// ── Timesheet rendering ───────────────────────────────

let allEntries: TimesheetEntry[] = [];

async function loadTimesheets() {
  const tbody = document.getElementById('ts-body')!;
  tbody.innerHTML = '<tr><td colspan="6" class="ts-empty">Loading...</td></tr>';

  try {
    allEntries = await getTimesheets();
    renderTimesheets();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="ts-empty">Error: ${(err as Error).message}</td></tr>`;
  }
}

function renderTimesheets() {
  const tbody = document.getElementById('ts-body')!;

  if (allEntries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="ts-empty">No entries yet. Click CHECK IN to start!</td></tr>';
    return;
  }

  tbody.innerHTML = allEntries.map((entry) => {
    const isActive = !entry.check_out;
    return `
      <tr>
        <td>${head ? (entry.username || '—') : formatDateTime(entry.check_in).split(',')[0]}</td>
        <td>${formatDateTime(entry.check_in)}</td>
        <td>${formatDateTime(entry.check_out)}</td>
        <td>
          ${formatDuration(entry.duration_minutes)}
          ${entry.edited_by_head ? '<span class="ts-badge"><i class="fas fa-pen"></i></span>' : ''}
        </td>
        <td>
          <span class="ts-status ${isActive ? 'active' : 'done'}">
            ${isActive ? 'Checked In' : 'Complete'}
          </span>
        </td>
        ${head ? `
          <td class="head-only">
            <div class="ts-actions">
              <button class="ts-action-btn" onclick="window.__editEntry('${entry.id}')">
                <i class="fas fa-pen"></i>
              </button>
              <button class="ts-action-btn delete" onclick="window.__deleteEntry('${entry.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        ` : '<td class="head-only" style="display:none;"></td>'}
      </tr>
    `;
  }).join('');
}

// ── Check-in/out is now handled by scan.html (camera QR scanner) ───
// The dashboard button links to scan.html which opens the camera.

// ── Universal QR panel ────────────────────────────────

async function loadUniversalQR() {
  const box = document.getElementById('qr-image-box')!;
  try {
    const data = await getUniversalQR();
    const fullUrl = `http://localhost:8000/uploads/${data.qr_code_path}`;
    box.innerHTML = `<img src="${fullUrl}" alt="Universal QR Code" style="width:240px;height:240px;">`;

    // Wire up the "Open Scan Page" link
    document.getElementById('open-scan-page')!.setAttribute('href', 'scan.html');
  } catch (err) {
    box.innerHTML = `<p style="color:#666; font-family:Rajdhani;">Failed to load QR: ${(err as Error).message}</p>`;
  }
}

// ── Head: Summary ─────────────────────────────────────

async function loadSummary() {
  if (!head) return;

  try {
    const [summary, members] = await Promise.all([getTimesheetSummary(), getMembers()]);

    const totalSessions = summary.users.reduce((sum, u) => sum + u.sessions, 0);
    const totalHours = summary.users.reduce((sum, u) => sum + u.total_hours, 0);

    document.getElementById('stat-members')!.textContent = String(members.length);
    document.getElementById('stat-sessions')!.textContent = String(totalSessions);
    document.getElementById('stat-hours')!.textContent = totalHours.toFixed(1);

    const tbody = document.getElementById('summary-body')!;
    if (summary.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="ts-empty">No completed sessions yet.</td></tr>';
      return;
    }

    tbody.innerHTML = summary.users.map((u) => `
      <tr>
        <td>${u.full_name || u.username}</td>
        <td>${u.sessions}</td>
        <td><strong style="color:var(--accent-primary)">${u.total_hours}h</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Summary error:', err);
  }
}

// ── Head: Add Member ──────────────────────────────────

const amForm = document.getElementById('addmember-form') as HTMLFormElement | null;
if (amForm) {
amForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amError = document.getElementById('addmember-error');
  const amSuccess = document.getElementById('addmember-success');
  const amBtn = document.getElementById('am-submit') as HTMLButtonElement | null;
  if (!amBtn) return;

  if (amError) amError.style.display = 'none';
  if (amSuccess) amSuccess.style.display = 'none';

  const fullName = (document.getElementById('am-fullname') as HTMLInputElement).value.trim();
  const username = (document.getElementById('am-username') as HTMLInputElement).value.trim();
  const email = (document.getElementById('am-email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('am-password') as HTMLInputElement).value;
  const department = (document.getElementById('am-department') as HTMLSelectElement).value;

  amBtn.disabled = true;
  amBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

  try {
    await registerMember(username, email, password, fullName, department);
    if (amSuccess) {
      amSuccess.style.display = 'block';
      amSuccess.textContent = `${fullName} (@${username}) added successfully!`;
    }
    amForm.reset();

    // Refresh members list
    loadMembers();
    loadSummary();
  } catch (err) {
    if (amError) {
      amError.style.display = 'block';
      amError.textContent = (err as Error).message;
    }
  }

  amBtn.disabled = false;
  amBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Member';
});
}

// ── Head: Members list ────────────────────────────────

async function loadMembers() {
  if (!head) return;

  try {
    const members = await getMembers();
    const list = document.getElementById('members-list')!;

    list.innerHTML = members.map((m) => `
      <div class="member-row">
        <div class="member-info">
          <h4>${m.full_name || m.username} ${m.role === 'head' ? '<span class="ts-badge">HEAD</span>' : ''}</h4>
          <p>@${m.username} • ${m.email}</p>
        </div>
        <div class="member-dept">${m.department}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Members error:', err);
  }
}

// ── Head: Edit/Delete timesheet ───────────────────────

let editingId: string | null = null;

(window as any).__editEntry = (id: string) => {
  const entry = allEntries.find((e) => e.id === id);
  if (!entry) return;
  editingId = id;

  const toLocal = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  (document.getElementById('edit-checkin') as HTMLInputElement).value = toLocal(entry.check_in);
  (document.getElementById('edit-checkout') as HTMLInputElement).value = toLocal(entry.check_out);
  (document.getElementById('edit-note') as HTMLInputElement).value = entry.note || '';

  document.getElementById('edit-modal')!.classList.add('active');
};

(window as any).__deleteEntry = async (id: string) => {
  if (!confirm('Delete this timesheet entry? This cannot be undone.')) return;
  try {
    await deleteTimesheet(id);
    await loadTimesheets();
  } catch (err) {
    alert(`Error: ${(err as Error).message}`);
  }
};

document.getElementById('edit-cancel')?.addEventListener('click', () => {
  document.getElementById('edit-modal')?.classList.remove('active');
  editingId = null;
});

document.getElementById('edit-save')?.addEventListener('click', async () => {
  if (!editingId) return;

  const fromLocal = (val: string) => (val ? new Date(val).toISOString() : undefined);

  const checkIn = (document.getElementById('edit-checkin') as HTMLInputElement)?.value || '';
  const checkOut = (document.getElementById('edit-checkout') as HTMLInputElement)?.value || '';
  const note = (document.getElementById('edit-note') as HTMLInputElement)?.value || '';

  try {
    await updateTimesheet(editingId, {
      check_in: fromLocal(checkIn),
      check_out: fromLocal(checkOut) || undefined,
      note: note,
    });
    document.getElementById('edit-modal')?.classList.remove('active');
    editingId = null;
    await loadTimesheets();
  } catch (err) {
    alert(`Error: ${(err as Error).message}`);
  }
});

// ── Hamburger menu ────────────────────────────────────

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks?.classList.toggle('active');
});

// ── Init ──────────────────────────────────────────────

loadTimesheets();
loadUniversalQR();
if (head) {
  loadSummary();
  loadMembers();
}
