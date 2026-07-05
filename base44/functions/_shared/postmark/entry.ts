/**
 * Postmark email helper — shared across all backend functions.
 * Uses POSTMARK_API_KEY, POSTMARK_FROM_EMAIL, POSTMARK_FROM_NAME secrets.
 */
export async function sendPostmarkEmail({ to, subject, textBody, htmlBody }) {
  const apiKey = Deno.env.get("POSTMARK_API_KEY");
  const fromEmail = Deno.env.get("POSTMARK_FROM_EMAIL");
  const fromName = Deno.env.get("POSTMARK_FROM_NAME") || "North Scale";

  if (!apiKey || !fromEmail) {
    throw new Error("Postmark is not configured. Set POSTMARK_API_KEY and POSTMARK_FROM_EMAIL.");
  }

  const payload = {
    From: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    To: to,
    Subject: subject,
    TextBody: textBody || "",
  };
  if (htmlBody) payload.HtmlBody = htmlBody;

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();

  if (!res.ok || result.ErrorCode) {
    throw new Error(`Postmark error ${result.ErrorCode}: ${result.Message}`);
  }

  return result;
}