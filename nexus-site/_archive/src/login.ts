/**
 * Login page logic — handles login + registration forms.
 */
import { login, register, isLoggedIn } from './api';

// Redirect if already logged in
if (isLoggedIn()) {
  window.location.href = 'dashboard.html';
}

// ── Tab switching ─────────────────────────────────────

const tabs = document.querySelectorAll<HTMLElement>('.auth-tab');
const panels = document.querySelectorAll<HTMLElement>('.auth-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.panel;
    tabs.forEach((t) => t.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById(`${target}-panel`);
    panel?.classList.add('active');
  });
});

// ── Login form ────────────────────────────────────────

const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
const loginError = document.getElementById('login-error') as HTMLElement | null;

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!loginError) return;
  loginError.style.display = 'none';

  const formData = new FormData(loginForm);
  const username = (formData.get('username') as string).trim();
  const password = formData.get('password') as string;

  const submitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (!submitBtn) return;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    await login(username, password);
    window.location.href = 'dashboard.html';
  } catch (err) {
    loginError.textContent = (err as Error).message;
    loginError.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});

// ── Register form ─────────────────────────────────────

const registerForm = document.getElementById('register-form') as HTMLFormElement | null;
const registerError = document.getElementById('register-error') as HTMLElement | null;
const registerSuccess = document.getElementById('register-success') as HTMLElement | null;

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!registerError || !registerSuccess) return;
  registerError.style.display = 'none';
  registerSuccess.style.display = 'none';

  const formData = new FormData(registerForm);
  const username = (formData.get('username') as string).trim();
  const email = (formData.get('email') as string).trim();
  const password = formData.get('password') as string;
  const full_name = (formData.get('full_name') as string).trim();
  const department = (formData.get('department') as string).trim();

  const submitBtn = registerForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (!submitBtn) return;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    await register(username, email, password, full_name, department);
    registerSuccess.style.display = 'block';
    registerSuccess.textContent = `Account created! You can now sign in.`;
    registerForm.reset();

    // Auto-switch to login tab
    setTimeout(() => {
      const loginTab = document.querySelector('[data-panel="login"]') as HTMLElement | null;
      loginTab?.click();
      const loginUsername = document.getElementById('login-username') as HTMLInputElement | null;
      if (loginUsername) loginUsername.value = username;
    }, 1500);
  } catch (err) {
    registerError.textContent = (err as Error).message;
    registerError.style.display = 'block';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Register';
});
