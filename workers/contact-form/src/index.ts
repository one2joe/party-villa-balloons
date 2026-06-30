interface Env {
  TURNSTILE_SECRET: string;
  CONTACT_EMAIL: string;
}

interface Notifier {
  send(subject: string, body: string): Promise<void>;
}

class ConsoleNotifier implements Notifier {
  async send(subject: string, body: string): Promise<void> {
    console.log(`[${subject}]\n${body}`);
  }
}

// class EmailNotifier implements Notifier {
//   async send(subject: string, body: string): Promise<void> {
//     // Example using a transactional email API (e.g. Resend, SendGrid, Mailgun)
//     // Set the API key and endpoint in your Worker secrets / env vars.
//     //
//     // const response = await fetch('https://api.resend.com/emails', {
//     //   method: 'POST',
//     //   headers: {
//     //     'Authorization': `Bearer ${env.RESEND_API_KEY}`,
//     //     'Content-Type': 'application/json',
//     //   },
//     //   body: JSON.stringify({
//     //     from: 'noreply@party-villa-balloons.pages.dev',
//     //     to: env.CONTACT_EMAIL,
//     //     subject,
//     //     text: body,
//     //   }),
//     // });
//     // if (!response.ok) {
//     //   console.error('Failed to send email', await response.text());
//     // }
//   }
// }

function getNotifier(): Notifier {
  return new ConsoleNotifier();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const turnstileToken = formData.get('cf-turnstile-response') as string;

    // Only name and phone are required (marked with * on the form)
    if (!name || !phone) {
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

    // Send notification
    const notifier = getNotifier();
    await notifier.send('ติดต่อใหม่จาก Party Villa Balloons', emailBody);

    return new Response('OK', {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  },
};
