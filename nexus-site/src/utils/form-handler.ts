/**
 * Handle contact form submission via FormSubmit.co.
 * Uses standard form POST (not AJAX) so the activation flow works:
 * 1. First submission → FormSubmit sends confirmation email to team inbox
 * 2. Click link in that email once to activate
 * 3. All future submissions arrive instantly in the inbox
 *
 * We intercept the form, show a "Sending..." state, then submit natively.
 */
const TEAM_EMAIL = 'nexusrobotics@gmail.com';

export class FormHandler {
  private form: HTMLFormElement | null;
  private submitBtn: HTMLElement | null;

  constructor(formId: string) {
    this.form = document.getElementById(formId) as HTMLFormElement | null;
    this.submitBtn = this.form?.querySelector('.submit-btn') || null;
    this.init();
  }

  private init(): void {
    if (!this.form) return;
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  private handleSubmit(e: Event): void {
    if (!this.form || !this.submitBtn) return;

    const formData = new FormData(this.form);
    const name = (formData.get('name') as string)?.trim() || '';
    const email = (formData.get('email') as string)?.trim() || '';
    const subject = (formData.get('subject') as string)?.trim() || '';
    const message = (formData.get('message') as string)?.trim() || '';

    if (!name || !email || !message) {
      e.preventDefault();
      this.showError('Please fill in all required fields.');
      return;
    }

    // Show sending state
    this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    this.submitBtn.setAttribute('disabled', 'true');

    // Build a hidden form that posts to FormSubmit and let the browser submit it
    e.preventDefault();

    const hiddenForm = document.createElement('form');
    hiddenForm.action = `https://formsubmit.co/${TEAM_EMAIL}`;
    hiddenForm.method = 'POST';
    hiddenForm.style.display = 'none';

    const fields: Record<string, string> = {
      name,
      email,
      subject: subject || 'Website Contact',
      message: `${message}\n\n— From: ${name} (${email})`,
      _subject: `[Website] ${subject || 'New Contact Form Submission'}`,
      _template: 'table',
      _captcha: 'false',
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      hiddenForm.appendChild(input);
    }

    // After submit, return to the contact page with a success flag
    const returnUrl = window.location.origin + window.location.pathname + '?sent=true';
    const returnInput = document.createElement('input');
    returnInput.type = 'hidden';
    returnInput.name = '_next';
    returnInput.value = returnUrl;
    hiddenForm.appendChild(returnInput);

    document.body.appendChild(hiddenForm);
    hiddenForm.submit();
  }

  private showError(msg: string): void {
    if (!this.submitBtn) return;
    const original = this.submitBtn.innerHTML;
    this.submitBtn.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    setTimeout(() => {
      this.submitBtn!.innerHTML = original;
    }, 2500);
  }
}
