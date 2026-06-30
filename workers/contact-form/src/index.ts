interface Env {
  TURNSTILE_SECRET: string;
  CONTACT_EMAIL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const message = formData.get('message') as string;
    const turnstileToken = formData.get('cf-turnstile-response') as string;

    if (!name || !phone || !message) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Verify Turnstile token
    const turnstileRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: turnstileToken,
        }),
      }
    );
    const turnstileData = await turnstileRes.json();

    if (!turnstileData.success) {
      return new Response('Invalid captcha', { status: 400 });
    }

    // Build email content from all form fields
    let emailBody = '=== รายชื่อผู้ติดต่อ ===\n\n';
    for (const [key, value] of formData.entries()) {
      if (key !== 'cf-turnstile-response') {
        emailBody += `${key}: ${value}\n`;
      }
    }

    // Send notification (console.log for now - email provider configurable)
    console.log('Contact form submission:', Object.fromEntries(formData));

    return new Response('OK', {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  },
};
