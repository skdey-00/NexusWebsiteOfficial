/**
 * Local Portal Login System
 * Handles admin authentication using localStorage (no backend needed)
 */

import { verifyAdminPassword, setAdminPassword } from './lib/local-members';

// ── DOM Elements ─────────────────────────────────────────

const loginForm = document.getElementById('login-form') as HTMLFormElement;
const passwordInput = document.getElementById('password-input') as HTMLInputElement;
const loginAlert = document.getElementById('login-alert') as HTMLElement;
const adminPanel = document.getElementById('admin-panel') as HTMLElement;
const loginPanel = document.getElementById('login-panel') as HTMLElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLElement;
const changePasswordForm = document.getElementById('change-password-form') as HTMLFormElement;
const currentPasswordInput = document.getElementById('current-password') as HTMLInputElement;
const newPasswordInput = document.getElementById('new-password') as HTMLInputElement;
const confirmPasswordInput = document.getElementById('confirm-password') as HTMLInputElement;
const passwordAlert = document.getElementById('password-alert') as HTMLElement;

// ── UI Helpers ─────────────────────────────────────────

function showAlert(element: HTMLElement, message: string, type: 'success' | 'error' = 'error') {
  element.textContent = message;
  element.className = `alert ${type} show`;

  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}

function hideAlert(element: HTMLElement) {
  element.classList.remove('show');
}

// ── Check for existing admin session ───────────────────────

function checkAdminSession() {
  const adminId = localStorage.getItem('robocon_admin_id');
  const adminName = localStorage.getItem('robocon_admin_name');

  if (adminId && adminName) {
    // User is already logged in
    showAdminPanel(adminName);
    return true;
  }

  return false;
}

function showAdminPanel(adminName: string) {
  loginPanel.style.display = 'none';
  adminPanel.style.display = 'block';

  // Update admin info
  const adminNameElement = document.getElementById('admin-name');
  if (adminNameElement) {
    adminNameElement.textContent = adminName;
  }
}

// ── Login Handler ─────────────────────────────────────────

loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();

  const password = passwordInput.value.trim();

  if (!password) {
    showAlert(loginAlert, 'Please enter the admin password');
    return;
  }

  hideAlert(loginAlert);

  // Verify password
  if (verifyAdminPassword(password)) {
    // Create admin session
    const adminId = 'admin_' + Date.now();
    localStorage.setItem('robocon_admin_id', adminId);
    localStorage.setItem('robocon_admin_name', 'Admin');
    localStorage.setItem('robocon_admin_username', 'admin');

    showAlert(loginAlert, 'Login successful! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = 'admin-dashboard.html';
    }, 1000);
  } else {
    showAlert(loginAlert, 'Invalid password. Please try again.');
    passwordInput.value = '';
    passwordInput.focus();
  }
});

// ── Logout Handler ────────────────────────────────────────

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('robocon_admin_id');
  localStorage.removeItem('robocon_admin_username');
  localStorage.removeItem('robocon_admin_name');

  window.location.href = 'portal.html';
});

// ── Change Password Handler ────────────────────────────────

changePasswordForm?.addEventListener('submit', (e) => {
  e.preventDefault();

  const currentPassword = currentPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  // Validate current password
  if (!verifyAdminPassword(currentPassword)) {
    showAlert(passwordAlert, 'Current password is incorrect');
    return;
  }

  // Validate new password
  if (newPassword.length < 4) {
    showAlert(passwordAlert, 'New password must be at least 4 characters');
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert(passwordAlert, 'New passwords do not match');
    return;
  }

  // Change password
  setAdminPassword(newPassword);
  showAlert(passwordAlert, 'Password changed successfully!', 'success');

  // Reset form
  changePasswordForm.reset();

  setTimeout(() => {
    hideAlert(passwordAlert);
  }, 3000);
});

// ── Quick Login Buttons (for testing) ──────────────────────

// Add a quick login button for testing
const quickLoginDiv = document.createElement('div');
quickLoginDiv.style.cssText = 'margin-top: 16px; text-align: center;';
quickLoginDiv.innerHTML = `
  <button type="button" id="quick-login-btn" style="background: transparent; border: 1px solid var(--border-light); color: var(--text-muted); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
    Quick Login (Default Password)
  </button>
`;

if (loginForm) {
  loginForm.parentNode?.insertBefore(quickLoginDiv, loginForm.nextSibling);

  document.getElementById('quick-login-btn')?.addEventListener('click', () => {
    passwordInput.value = 'admin1234';
    passwordInput.focus();
  });
}

// ── Show login hint on first visit ─────────────────────────

if (!localStorage.getItem('robocon_has_visited')) {
  const hintDiv = document.createElement('div');
  hintDiv.style.cssText = 'margin-top: 12px; padding: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; text-align: center; font-size: 13px; color: #93c5fd;';
  hintDiv.innerHTML = `
    <strong>First time?</strong> Default password is: <code style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">admin1234</code>
  `;

  if (loginForm) {
    loginForm.parentNode?.insertBefore(hintDiv, loginForm);
    localStorage.setItem('robocon_has_visited', 'true');
  }
}

// ── Hamburger Menu ─────────────────────────────────────────

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks?.classList.toggle('active');
});

// ── Check session on load ───────────────────────────────────

if (checkAdminSession()) {
  console.log('Admin session found, user is logged in');
} else {
  console.log('No admin session found, showing login form');
}
