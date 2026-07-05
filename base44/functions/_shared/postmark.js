export function getPostmarkConfig() {
  return {
    apiKey: Deno.env.get('POSTMARK_API_KEY') || '',
    fromEmail: Deno.env.get('POSTMARK_FROM_EMAIL') || 'portal@northscale.capital',
    fromName: Deno.env.get('POSTMARK_FROM_NAME') || 'North Scale',
  };
}

export function isPostmarkConfigured() {
  const cfg = getPostmarkConfig();
  return !!(cfg.apiKey && cfg.fromEmail);
}

/**
 * Send a transactional email via Postmark.
 * @param {{ to: string, subject: string, textBody?: string, htmlBody?: string }} opts
 */
export async function sendPostmarkEmail(opts) {
  const { to, subject, textBody, htmlBody } = opts;
  const { apiKey, fromEmail, fromName } = getPostmarkConfig();

  if (!apiKey) {
    throw new Error('POSTMARK_API_KEY not configured');
  }
  if (!to || !subject) {
    throw new Error('to and subject are required');
  }

  const payload = {
    From: `${fromName} <${fromEmail}>`,
    To: to,
    Subject: subject,
  };
  if (textBody) payload.TextBody = textBody;
  if (htmlBody) payload.HtmlBody = htmlBody;

  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error(data.Message || data.message || 'Postmark error');
  }
  return data;
}
