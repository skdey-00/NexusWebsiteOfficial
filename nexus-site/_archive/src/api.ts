/**
 * Shared API client for the Robocon backend.
 * Handles JWT token storage, auth headers, and error normalisation.
 */

// Backend runs on port 8000. Vite dev server is 3000/3001.
const API_BASE = 'http://localhost:8000/api';

const TOKEN_KEY = 'robocon_token';
const USER_KEY = 'robocon_user';

// ── Token management ──────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: StoredUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function isHead(): boolean {
  const user = getUser();
  return user?.role === 'head';
}

// ── Types ─────────────────────────────────────────────

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'head' | 'member';
  department: string;
  qr_token: string;
}

export interface TimesheetEntry {
  id: string;
  user_id: string;
  username: string | null;
  check_in: string;
  check_out: string | null;
  duration_minutes: number | null;
  note: string;
  edited_by_head: boolean;
}

export interface TimesheetSummary {
  users: Array<{
    user_id: string;
    username: string;
    full_name: string;
    sessions: number;
    total_minutes: number;
    total_hours: number;
  }>;
}

// ── Fetch wrapper ─────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as { detail?: string }).detail ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

// ── Auth API ──────────────────────────────────────────

export async function login(
  username: string,
  password: string,
): Promise<{ access_token: string; user: StoredUser }> {
  const data = await apiFetch<{
    access_token: string;
    token_type: string;
    user: StoredUser;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  setAuth(data.access_token, data.user);
  return data;
}

export async function register(
  username: string,
  email: string,
  password: string,
  full_name: string,
  department: string,
): Promise<StoredUser> {
  return apiFetch<StoredUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, full_name, department }),
  });
}

export async function fetchMe(): Promise<StoredUser> {
  return apiFetch<StoredUser>('/auth/me');
}

// ── Timesheet API ─────────────────────────────────────

export async function getTimesheets(
  userId?: string,
): Promise<TimesheetEntry[]> {
  const qs = userId ? `?user_id=${userId}` : '';
  return apiFetch<TimesheetEntry[]>(`/timesheet${qs}`);
}

export async function scanQR(
  qrToken: string,
): Promise<TimesheetEntry> {
  return apiFetch<TimesheetEntry>('/timesheet/scan', {
    method: 'POST',
    body: JSON.stringify({ qr_token: qrToken }),
  });
}

export async function updateTimesheet(
  id: string,
  data: {
    check_in?: string;
    check_out?: string;
    note?: string;
  },
): Promise<TimesheetEntry> {
  return apiFetch<TimesheetEntry>(`/timesheet/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTimesheet(id: string): Promise<void> {
  await apiFetch<void>(`/timesheet/${id}`, { method: 'DELETE' });
}

export async function getTimesheetSummary(): Promise<TimesheetSummary> {
  return apiFetch<TimesheetSummary>('/timesheet/summary');
}

export async function getQRCode(
  userId: string,
): Promise<{ qr_code_path: string; qr_token: string }> {
  return apiFetch<{ qr_code_path: string; qr_token: string }>(
    `/timesheet/qr/${userId}`,
  );
}

export async function getMembers(): Promise<StoredUser[]> {
  return apiFetch<StoredUser[]>('/auth/members');
}

// ── Head: register member ─────────────────────────────

export async function registerMember(
  username: string,
  email: string,
  password: string,
  full_name: string,
  department: string,
): Promise<StoredUser> {
  return apiFetch<StoredUser>('/auth/register-member', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, full_name, department }),
  });
}

// ── Universal QR check-in/out ─────────────────────────

export async function checkInOut(): Promise<TimesheetEntry> {
  return apiFetch<TimesheetEntry>('/timesheet/check-inout', { method: 'POST' });
}

export async function getUniversalQR(): Promise<{ qr_code_path: string; scan_url: string }> {
  return apiFetch<{ qr_code_path: string; scan_url: string }>('/timesheet/universal-qr');
}

// ── Helpers ───────────────────────────────────────────

/** Require auth on a page; redirect to login if not logged in. */
export function requireAuth(): StoredUser {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = 'login.html';
    // This return is just for TS; the redirect fires first.
    return {} as StoredUser;
  }
  return user;
}

/** Format ISO datetime → readable IST string. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format duration minutes → "2h 15m" or "45m". */
export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
