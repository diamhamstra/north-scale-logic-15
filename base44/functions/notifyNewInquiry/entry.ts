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

const ADMIN_EMAIL = "info@northscale.capital";

const INQUIRY_LABELS = {
  prospective_investor: "Prospective Investor", family_office: "Family Office",
  institutional_investor: "Institutional Investor", investment_consultant: "Investment Consultant",
  quant_trader: "Quant Trader", portfolio_manager: "Portfolio Manager",
  broker_partnership: "Broker / Exchange", technology_partnership: "Technology Partnership",
  liquidity_provider: "Liquidity Provider", media: "Media", general: "General", other: "Other"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { full_name, email, organization, country, phone, inquiry_type, message, priority_tag } = body;

    const submittedAt = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
    const typeLabel = INQUIRY_LABELS[inquiry_type] || inquiry_type || "Other";
    const first_name = (full_name || "").split(" ")[0] || "there";

    // 1. Save inquiry
    let inquiry = null;
    try {
      inquiry = await base44.asServiceRole.entities.Inquiry.create({
        full_name, email, organization: organization || "", country: country || "",
        inquiry_type: inquiry_type || "other", message,
        priority_tag: priority_tag || "general", status: "under_review",
      });
    } catch (e) { console.error("Inquiry create failed:", e.message); }

    // 2. Create CRM lead
    let crmRecord = null;
    try {
      crmRecord = await base44.asServiceRole.entities.CRMRecord.create({
        full_name, email,
        organization: organization || "",
        lead_source: "website_inquiry",
        client_status: "lead",
        registration_date: new Date().toISOString().split("T")[0],
        notes: `Inquiry type: ${typeLabel}\nCountry: ${country || "—"}\nPhone: ${phone || "—"}\nMessage: ${message || "—"}`,
        inquiry_id: inquiry?.id || "",
      });
    } catch (e) { console.error("CRM lead create failed:", e.message); }

    // 3. Admin email
    try {
      await sendPostmarkEmail({
        to: ADMIN_EMAIL,
        subject: `New Website Inquiry — ${full_name}`,
        textBody: `New Website Inquiry\n\nName: ${full_name}\nEmail: ${email}\nCompany: ${organization || "—"}\nPhone: ${phone || "—"}\nCountry: ${country || "—"}\nType: ${typeLabel}\nSubmitted: ${submittedAt}\n\nMessage:\n${message || "—"}`,
      });
      console.log("Admin email sent");
    } catch (e) { console.error("Admin email failed:", e.message); }

    // 4. Confirmation email to visitor
    try {
      await sendPostmarkEmail({
        to: email,
        subject: "We've received your inquiry — North Scale",
        textBody: `Hello ${first_name},\n\nThank you for contacting North Scale.\n\nWe have successfully received your inquiry and a member of our team will review your message and respond as soon as possible.\n\nKind regards,\nNorth Scale`,
      });
      console.log("Confirmation email sent to", email);
    } catch (e) { console.error("Confirmation email failed:", e.message); }

    // 5. In-app admin notifications
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      await Promise.all(admins.map(admin =>
        base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          category: "Account",
          title: "New Website Inquiry",
          message: `${full_name} submitted a new inquiry${organization ? ` from ${organization}` : ""}.`,
          action_label: "Open Lead",
          action_url: `/admin-portal?m=clients&s=leads`,
          is_action_required: false,
          sent_by_admin: false,
        })
      ));
    } catch (e) { console.error("Notifications failed:", e.message); }

    return Response.json({ success: true, inquiry_id: inquiry?.id, crm_id: crmRecord?.id });
  } catch (error) {
    console.error("Handler error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});