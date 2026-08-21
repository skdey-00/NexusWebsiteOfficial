/**
 * Portal Login — Supports both admin and member authentication
 * Admin: username/password → admin dashboard
 * Members: name/PIN → scan page
 */

import { loginMember, loginAdmin } from './lib/supabase-client';

// ── Demo Mode (for testing without Supabase) ─────────────

const DEMO_MODE = false; // Set to true for testing without database

const DEMO_MEMBERS = [
  { id: 'demo-1', name: 'Mayank Verma', department: 'Embedded Coding', pin: '4821' },
  { id: 'demo-2', name: 'Aryan Nair', department: 'Mechanical', pin: '7395' },
  { id: 'demo-3', name: 'Tashi Shrivastava', department: 'IP & MATLAB', pin: '8821' },
  { id: 'demo-4', name: 'Daksh Mishra', department: 'Embedded Coding', pin: '5612' },
];

const DEMO_ADMIN = {
  id: 'admin-demo',
  username: 'admin',
  password: 'admin123',
  name: 'Demo Admin',
};

// ── Constants ─────────────────────────────────────────────

const MEMBER_ID_KEY = 'robocon_member_id';
const MEMBER_NAME_KEY = 'robocon_member_name';
const MEMBER_DEPT_KEY = 'robocon_member_dept';

const ADMIN_ID_KEY = 'robocon_admin_id';
const ADMIN_USERNAME_KEY = 'robocon_admin_username';
const ADMIN_NAME_KEY = 'robocon_admin_name';

// ── Types ─────────────────────────────────────────────

interface LoginType {
  isAdmin: boolean;
  username?: string;
  password?: string;
  name?: string;
  pin?: string;
}

// ── DOM Elements ─────────────────────────────────────────

const loginForm = document.getElementById('login-form') as HTMLFormElement;
const nameInput = document.getElementById('name-input') as HTMLInputElement;
const pinInput = document.getElementById('pin-input') as HTMLInputElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const errorAlert = document.getElementById('error-alert') as HTMLDivElement;
const successAlert = document.getElementById('success-alert') as HTMLDivElement;
const switchUserSection = document.getElementById('switch-user-section') as HTMLDivElement;
const switchUserBtn = document.getElementById('switch-user-btn') as HTMLButtonElement;
const currentUserName = document.getElementById('current-user-name') as HTMLSpanElement;

// ── Check for existing session ────────────────────────────

function checkExistingSession() {
  const adminId = localStorage.getItem(ADMIN_ID_KEY);
  const adminName = localStorage.getItem(ADMIN_NAME_KEY);

  // Check for admin session first
  if (adminId && adminName) {
    currentUserName.textContent = `${adminName} (Admin)`;
    switchUserSection.style.display = 'block';

    setTimeout(() => {
      showSuccess(`Welcome back, ${adminName}! Redirecting to admin dashboard...`);
      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 1500);
    }, 500);
    return;
  }

  // Check for member session
  const savedName = localStorage.getItem(MEMBER_NAME_KEY);
  const savedId = localStorage.getItem(MEMBER_ID_KEY);

  if (savedName && savedId) {
    currentUserName.textContent = savedName;
    switchUserSection.style.display = 'block';

    // Auto-redirect to scan-new.html after a brief moment
    setTimeout(() => {
      showSuccess(`Welcome back, ${savedName}! Redirecting to scan...`);
      setTimeout(() => {
        window.location.href = 'scan-new.html';
      }, 1500);
    }, 500);
  }
}

// ── UI Helpers ─────────────────────────────────────────────

function showError(message: string) {
  errorAlert.textContent = message;
  errorAlert.classList.add('show');
  successAlert.classList.remove('show');

  setTimeout(() => {
    errorAlert.classList.remove('show');
  }, 5000);
}

function showSuccess(message: string) {
  successAlert.textContent = message;
  successAlert.classList.add('show');
  errorAlert.classList.remove('show');

  setTimeout(() => {
    successAlert.classList.remove('show');
  }, 5000);
}

function setLoading(loading: boolean) {
  submitBtn.disabled = loading;
  submitBtn.innerHTML = loading
    ? '<i class="fas fa-spinner fa-spin"></i> LOGGING IN...'
    : '<i class="fas fa-arrow-right-to-bracket"></i> LOGIN';
}

// ── Login Handler ─────────────────────────────────────────

async function handleLogin(e: Event) {
  e.preventDefault();

  const name = nameInput.value.trim();
  const pin = pinInput.value.trim();

  // Detect login type based on input
  const isAdminLogin = pin.length > 4 || pin.includes('@') || name.includes('@');

  // Basic validation
  if (!name) {
    showError('Please enter your name or username');
    return;
  }

  if (!pin) {
    showError('Please enter your PIN or password');
    return;
  }

  setLoading(true);
  errorAlert.classList.remove('show');

  try {
    if (isAdminLogin) {
      // Admin login
      let admin;

      if (DEMO_MODE) {
        admin = DEMO_ADMIN;
      } else {
        const { supabase } = await import('./lib/supabase-client.js');
        if (!supabase) {
          throw new Error('SUPABASE_NOT_CONFIGURED');
        }

        admin = await loginAdmin(name, pin);

        if (!admin) {
          showError('Invalid admin credentials. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Store admin session
      localStorage.setItem(ADMIN_ID_KEY, admin.id);
      localStorage.setItem(ADMIN_USERNAME_KEY, admin.username || name);
      localStorage.setItem(ADMIN_NAME_KEY, admin.name);

      showSuccess(`Admin login successful! Welcome, ${admin.name}.`);

      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 1200);

    } else {
      // Member login
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        showError('Please enter a valid 4-digit PIN');
        setLoading(false);
        return;
      }

      let member;

      if (DEMO_MODE) {
        member = DEMO_MEMBERS.find(m =>
          m.name.toLowerCase().includes(name.toLowerCase()) && m.pin === pin
        );

        if (!member) {
          showError('Invalid name or PIN. Try: Mayank Verma/4821, Aryan Nair/7395, Tashi/8821, Daksh/5612');
          setLoading(false);
          return;
        }
      } else {
        const { supabase } = await import('./lib/supabase-client.js');
        if (!supabase) {
          throw new Error('SUPABASE_NOT_CONFIGURED');
        }

        member = await loginMember(pin, name);

        if (!member) {
          showError('Invalid name or PIN. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Store member session
      localStorage.setItem(MEMBER_ID_KEY, member.id);
      localStorage.setItem(MEMBER_NAME_KEY, member.name);
      localStorage.setItem(MEMBER_DEPT_KEY, member.department);

      showSuccess(`Login successful! Welcome, ${member.name}.`);

      setTimeout(() => {
        window.location.href = 'scan-new.html';
      }, 1200);
    }

  } catch (err: any) {
    console.error('Login error:', err);

    if (err.message === 'SUPABASE_NOT_CONFIGURED') {
      showError('System not configured. Please check SETUP_GUIDE.md for Supabase setup instructions.');
    } else {
      showError('Login failed. Please check your connection and try again.');
    }
    setLoading(false);
  }
}

// ── Switch User Handler ─────────────────────────────────

function handleSwitchUser() {
  localStorage.removeItem(MEMBER_ID_KEY);
  localStorage.removeItem(MEMBER_NAME_KEY);
  localStorage.removeItem(MEMBER_DEPT_KEY);
  localStorage.removeItem(ADMIN_ID_KEY);
  localStorage.removeItem(ADMIN_USERNAME_KEY);
  localStorage.removeItem(ADMIN_NAME_KEY);

  switchUserSection.style.display = 'none';
  nameInput.value = '';
  pinInput.value = '';

  showInfo('Session cleared. You can now log in as a different user.');
}

function showInfo(message: string) {
  successAlert.textContent = message;
  successAlert.classList.add('show');
  errorAlert.classList.remove('show');

  setTimeout(() => {
    successAlert.classList.remove('show');
  }, 3000);
}

// ── Pin Input Formatting ──────────────────────────────────

function handlePinInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const name = nameInput.value.trim().toLowerCase();

  // Check if this looks like an admin login (name contains @ or is 'admin')
  const isAdminLogin = name.includes('@') || name === 'admin' || name === 'administrator';

  // For member logins: only allow 4 digits
  // For admin logins: allow any characters
  if (!isAdminLogin) {
    input.value = input.value.replace(/\D/g, '').slice(0, 4);
  }
}

// ── Event Listeners ───────────────────────────────────────

loginForm.addEventListener('submit', handleLogin);
pinInput.addEventListener('input', handlePinInput);
switchUserBtn.addEventListener('click', handleSwitchUser);

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks?.classList.toggle('active');
});

// ── Init ─────────────────────────────────────────────────

// Check if Supabase is configured on page load
(async () => {
  try {
    if (!DEMO_MODE) {
      const { supabase } = await import('./lib/supabase-client.js');
      if (!supabase) {
        showError('Attendance system not configured. Please set up Supabase credentials first.');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> SYSTEM NOT CONFIGURED';
        return;
      }
    }
  } catch (err) {
    console.error('Config check failed:', err);
  }

  checkExistingSession();
})();
