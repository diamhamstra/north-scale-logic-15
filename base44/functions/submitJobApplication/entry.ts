import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function getPostmarkConfig() {
  return {
    apiKey: Deno.env.get('POSTMARK_API_KEY') || '',
    fromEmail: Deno.env.get('POSTMARK_FROM_EMAIL') || 'portal@northscale.capital',
    fromName: Deno.env.get('POSTMARK_FROM_NAME') || 'North Scale',
  };
}

async function sendPostmarkEmail(opts) {
  const { to, subject, textBody, htmlBody } = opts;
  const { apiKey, fromEmail, fromName } = getPostmarkConfig();
  if (!apiKey) throw new Error('POSTMARK_API_KEY not configured');
  if (!to || !subject) throw new Error('to and subject are required');
  const payload = { From: `${fromName} <${fromEmail}>`, To: to, Subject: subject };
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
  if (!res.ok) throw new Error(data.Message || data.message || 'Postmark error');
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { application_id, first_name, last_name, email, position } = await req.json();

    const applicantHtml = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'IBM Plex Mono', monospace; background: #0a111f; color: #e2e8f0; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
              .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.36em; color: #64748b; }
              h1 { font-family: 'Instrument Serif', serif; font-size: 28px; color: #f1f5f9; margin: 10px 0; }
              .content { font-size: 13px; color: #94a3b8; }
              .status { display: inline-block; border: 1px solid #1e293b; padding: 8px 16px; margin-top: 20px; }
              .status-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; display: inline-block; margin-right: 8px; }
              .footer { border-top: 1px solid #1e293b; margin-top: 40px; padding-top: 20px; font-size: 10px; color: #475569; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="label">North Scale</div>
                <h1>Application Received</h1>
              </div>
              <div class="content">
                <p>Dear ${first_name} ${last_name},</p>
                <p>Thank you for your application for the <strong>${position}</strong> position at North Scale.</p>
                <p>Your application (Reference: ${application_id}) has been received and is now under review by our team.</p>
                <div class="status">
                  <span class="status-dot"></span>
                  Status: Under Review
                </div>
                <p style="margin-top: 30px;">We review all applications confidentially and will contact you if your profile matches our requirements. Due to the volume of applications we receive, we may not be able to respond to every submission individually.</p>
                <p style="margin-top: 30px;">Thank you for your interest in joining North Scale.</p>
                <p style="margin-top: 30px;">Best regards,<br>North Scale Team</p>
              </div>
              <div class="footer">
                <p>This is an automated confirmation. Please do not reply to this email.</p>
                <p>© ${new Date().getFullYear()} North Scale. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>`;

    try {
      await sendPostmarkEmail({
        to: email,
        subject: `Application Received - ${position}`,
        htmlBody: applicantHtml,
        textBody: `Dear ${first_name} ${last_name},\n\nThank you for your application for the ${position} position at North Scale.\n\nYour application (Reference: ${application_id}) has been received and is now under review.\n\nBest regards,\nNorth Scale Team`,
      });
    } catch (e) {
      console.error('Applicant email error:', e.message);
    }

    const adminHtml = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'IBM Plex Mono', monospace; background: #0a111f; color: #e2e8f0; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
              .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.36em; color: #64748b; }
              h1 { font-family: 'Instrument Serif', serif; font-size: 28px; color: #f1f5f9; margin: 10px 0; }
              .detail { margin-bottom: 15px; }
              .detail-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.32em; color: #64748b; display: block; margin-bottom: 4px; }
              .detail-value { font-size: 13px; color: #e2e8f0; }
              .footer { border-top: 1px solid #1e293b; margin-top: 40px; padding-top: 20px; font-size: 10px; color: #475569; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="label">New Job Application</div>
                <h1>${position}</h1>
              </div>
              <div class="detail">
                <span class="detail-label">Applicant</span>
                <span class="detail-value">${first_name} ${last_name}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Email</span>
                <span class="detail-value">${email}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Application ID</span>
                <span class="detail-value">${application_id}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Submitted</span>
                <span class="detail-value">${new Date().toLocaleString('en-GB')}</span>
              </div>
              <div class="footer">
                <p>North Scale Recruitment System</p>
              </div>
            </div>
          </body>
        </html>`;

    const cfg = getPostmarkConfig();
    try {
      await sendPostmarkEmail({
        to: cfg.fromEmail,
        subject: `New Application: ${position} - ${first_name} ${last_name}`,
        htmlBody: adminHtml,
        textBody: `New job application: ${position}\nApplicant: ${first_name} ${last_name}\nEmail: ${email}\nReference: ${application_id}`,
      });
    } catch (e) {
      console.error('Admin email error:', e.message);
    }

    return Response.json({ success: true, application_id });
  } catch (error) {
    console.error('Error in submitJobApplication:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
