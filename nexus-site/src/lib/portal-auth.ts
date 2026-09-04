/**
 * NEXUS ROBOTICS INTERNAL PORTAL
 * Authentication & Session Management
 */

import type { Member, AdminUser } from './supabase';

const SESSION_STORAGE_KEY = 'nexus_portal_session';
const REDIRECT_KEY = 'nexus_portal_redirect';

export interface PortalSession {
  type: 'member' | 'admin';
  user: Member | AdminUser;
  timestamp: number;
}

// ============================================================
// -- SESSION MANAGEMENT
// ============================================================

export function createSession(type: 'member' | 'admin', user: Member | AdminUser): void {
  const session: PortalSession = {
    type,
    user,
    timestamp: Date.now()
  };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): PortalSession | null {
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function isMember(): boolean {
  const session = getSession();
  return session?.type === 'member';
}

export function isAdmin(): boolean {
  const session = getSession();
  return session?.type === 'admin';
}

// ============================================================
// -- REDIRECT MANAGEMENT
// -- ============================================================

export function setRedirect(url: string): void {
  sessionStorage.setItem(REDIRECT_KEY, url);
}

export function getRedirect(): string | null {
  const redirect = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return redirect;
}

// ============================================================
// -- ROUTE PROTECTION
// ============================================================

export function requireAuth(): void {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname;
    setRedirect(currentPath);
    window.location.href = '/portal/login.html';
  }
}

export function requireMember(): void {
  if (!isMember()) {
    window.location.href = '/portal/login.html';
  }
}

export function requireAdmin(): void {
  if (!isAdmin()) {
    window.location.href = '/portal/login.html';
  }
}

export function redirectBasedOnRole(): void {
  const session = getSession();
  if (!session) {
    window.location.href = '/portal/login.html';
    return;
  }

  if (session.type === 'admin') {
    window.location.href = '/portal/admin.html';
  } else {
    window.location.href = '/portal/member.html';
  }
}

// ============================================================
// -- LOGOUT
// ============================================================

export function logout(): void {
  clearSession();
  window.location.href = '/portal/login.html';
}
