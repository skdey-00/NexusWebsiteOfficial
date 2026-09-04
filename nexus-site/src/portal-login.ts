/**
 * NEXUS ROBOTICS INTERNAL PORTAL
 * Login Page Controller
 */

import { loginMember, loginAdmin } from './lib/supabase';
import { createSession, getSession, getRedirect, redirectBasedOnRole } from './lib/portal-auth';
import { isValidPIN } from './lib/portal-utils';

// DOM Elements
const form = document.getElementById('login-form') as HTMLFormElement;
const identityInput = document.getElementById('identity-input') as HTMLInputElement;
const credentialInput = document.getElementById('credential-input') as HTMLInputElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const errorAlert = document.getElementById('error-alert') as HTMLDivElement;
const successAlert = document.getElementById('success-alert') as HTMLDivElement;

// ============================================================
// ALERT MESSAGES
// ============================================================

function showError(message: string): void {
  errorAlert.textContent = message;
  errorAlert.classList.add('show');
  successAlert.classList.remove('show');

  setTimeout(() => {
    errorAlert.classList.remove('show');
  }, 5000);
}

function showSuccess(message: string): void {
  successAlert.textContent = message;
  successAlert.classList.add('show');
  errorAlert.classList.remove('show');

  setTimeout(() => {
    successAlert.classList.remove('show');
  }, 3000);
}

function clearAlerts(): void {
  errorAlert.classList.remove('show');
  successAlert.classList.remove('show');
}

// ============================================================
// FORM HANDLING
// ============================================================

function setLoading(loading: boolean): void {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION';
}

async function handleLogin(e: Event): Promise<void> {
  e.preventDefault();

  const identity = identityInput.value.trim();
  const credential = credentialInput.value.trim();

  if (!identity || !credential) {
    showError('Credentials required. Please provide both identity and authentication code.');
    return;
  }

  clearAlerts();
  setLoading(true);

  try {
    // Try member login first (PIN-based)
    if (isValidPIN(credential)) {
      const member = await loginMember(identity, credential);

      if (member) {
        createSession('member', member);
        showSuccess(`Welcome back, ${member.name}`);

        const redirect = getRedirect();
        setTimeout(() => {
          if (redirect && redirect.includes('/portal/')) {
            window.location.href = redirect;
          } else {
            window.location.href = '/portal/member.html';
          }
        }, 1000);
        return;
      }
    }

    // Try admin login (username/password)
    const admin = await loginAdmin(identity, credential);

    if (admin) {
      createSession('admin', admin);
      showSuccess(`Administrator access granted: ${admin.name}`);

      const redirect = getRedirect();
      setTimeout(() => {
        if (redirect && redirect.includes('/portal/')) {
          window.location.href = redirect;
        } else {
          window.location.href = '/portal/admin.html';
        }
      }, 1000);
      return;
    }

    // Neither login succeeded
    showError('Authentication failed. Invalid credentials or access denied.');

  } catch (error) {
    console.error('[Portal Login] Error:', error);
    showError('System error. Unable to authenticate. Please try again.');
  } finally {
    setLoading(false);
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

function init(): void {
  // Check if already authenticated
  const session = getSession();
  if (session) {
    const redirect = getRedirect();
    if (redirect && redirect.includes('/portal/')) {
      window.location.href = redirect;
    } else {
      redirectBasedOnRole();
    }
    return;
  }

  // Set up form submission
  form.addEventListener('submit', handleLogin);

  // Focus on identity input
  identityInput.focus();

  console.log('[Portal Login] Initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
