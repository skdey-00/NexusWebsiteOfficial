/**
 * QR Scanner — live camera feed + jsQR decoding.
 * When member points camera at the universal QR, it auto check-in/out.
 */
import { isLoggedIn, requireAuth, checkInOut, formatDateTime, formatDuration } from './api';

// Guard: must be logged in
if (!isLoggedIn()) {
  window.location.href = 'login.html';
}
const user = requireAuth();

// ── DOM ───────────────────────────────────────────────
const video = document.getElementById('camera-video') as HTMLVideoElement;
const canvas = document.getElementById('camera-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

const cameraView = document.getElementById('camera-view')!;
const resultView = document.getElementById('result-view')!;
const errorView = document.getElementById('error-view')!;

const statusTitle = document.getElementById('status-title')!;
const statusSub = document.getElementById('status-sub')!;

// ── State ─────────────────────────────────────────────
let stream: MediaStream | null = null;
let scanning = false;
let cooldown = false; // prevent double-scan within 3s

// ── Start camera ──────────────────────────────────────

async function startCamera() {
  statusTitle.textContent = 'STARTING CAMERA...';
  statusSub.textContent = 'Please allow camera access';

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    await video.play();

    statusTitle.textContent = 'SCANNING...';
    statusSub.textContent = 'Point your camera at the QR code';
    scanning = true;
    requestAnimationFrame(tick);
  } catch (err: any) {
    showError(err);
  }
}

// ── Frame loop: capture + decode ──────────────────────

function tick() {
  if (!scanning) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    // Size canvas to video frame
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w && h) {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);

      // jsQR is loaded from CDN script tag
      const code = (window as any).jsQR(imageData.data, w, h, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && !cooldown) {
        handleQRDetected(code.data);
        return;
      }
    }
  }

  requestAnimationFrame(tick);
}

// ── QR detected → check-in/out ────────────────────────

async function handleQRDetected(_qrData: string) {
  cooldown = true;
  scanning = false;

  // Stop the scan line animation
  statusTitle.textContent = 'QR DETECTED!';
  statusSub.textContent = 'Checking you in/out...';

  // Brief haptic feedback if available
  if (navigator.vibrate) navigator.vibrate(100);

  try {
    const result = await checkInOut();

    // Stop camera
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }

    showResult(result);
  } catch (err: any) {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    showErrorResult(err.message || 'Something went wrong');
  }
}

// ── Result screen ─────────────────────────────────────

function showResult(result: any) {
  cameraView.style.display = 'none';
  resultView.style.display = 'flex';

  const icon = document.getElementById('result-icon')!;
  const title = document.getElementById('result-title')!;
  const sub = document.getElementById('result-sub')!;
  const card = document.getElementById('result-card')!;

  if (result.check_out) {
    // Checked OUT
    icon.className = 'fas fa-arrow-right-from-bracket result-icon checkout';
    title.textContent = 'CHECKED OUT';
    title.style.color = '#fb923c';
    sub.textContent = 'See you next time!';
    card.innerHTML = `
      <div class="result-row">
        <span class="label">Member</span>
        <span class="value">${user.full_name || user.username}</span>
      </div>
      <div class="result-row">
        <span class="label">Check In</span>
        <span class="value">${formatDateTime(result.check_in)}</span>
      </div>
      <div class="result-row">
        <span class="label">Check Out</span>
        <span class="value orange">${formatDateTime(result.check_out)}</span>
      </div>
      <div class="result-row">
        <span class="label">Duration</span>
        <span class="value" style="font-size:18px;">${formatDuration(result.duration_minutes)}</span>
      </div>
    `;
  } else {
    // Checked IN
    icon.className = 'fas fa-arrow-right-to-bracket result-icon checkin';
    title.textContent = 'CHECKED IN';
    title.style.color = '#22c55e';
    sub.textContent = 'Welcome to the lab!';
    card.innerHTML = `
      <div class="result-row">
        <span class="label">Member</span>
        <span class="value">${user.full_name || user.username}</span>
      </div>
      <div class="result-row">
        <span class="label">Check In Time</span>
        <span class="value green">${formatDateTime(result.check_in)}</span>
      </div>
      <div class="result-row">
        <span class="label">Status</span>
        <span class="value green">ACTIVE</span>
      </div>
    `;
  }
}

function showErrorResult(msg: string) {
  cameraView.style.display = 'none';
  resultView.style.display = 'flex';

  const icon = document.getElementById('result-icon')!;
  const title = document.getElementById('result-title')!;
  const sub = document.getElementById('result-sub')!;
  const card = document.getElementById('result-card')!;

  icon.className = 'fas fa-triangle-exclamation result-icon error';
  title.textContent = 'ERROR';
  title.style.color = '#ef4444';
  sub.textContent = '';
  card.innerHTML = `<div class="result-row"><span class="value" style="color:#fca5a5;">${msg}</span></div>`;
}

// ── Error screen ──────────────────────────────────────

function showError(err: any) {
  cameraView.style.display = 'none';
  errorView.style.display = 'flex';

  const msg = document.getElementById('error-msg')!;
  if (err.name === 'NotAllowedError') {
    msg.textContent = 'Camera permission was denied. Please refresh and allow camera access to scan QR codes.';
  } else if (err.name === 'NotFoundError') {
    msg.textContent = 'No camera found on this device. Try using a phone or a device with a webcam.';
  } else {
    msg.textContent = `Camera error: ${err.message || err}. Make sure you are on HTTPS or localhost.`;
  }
}

// ── Scan Again button ─────────────────────────────────

document.getElementById('btn-scan-again')!.addEventListener('click', async () => {
  resultView.style.display = 'none';
  cameraView.style.display = 'flex';

  // Reset cooldown after 1s
  setTimeout(() => { cooldown = false; }, 1000);

  await startCamera();
});

// ── Start ─────────────────────────────────────────────

startCamera();
