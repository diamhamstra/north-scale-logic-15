/** Shared privacy / GDPR copy and document metadata for the investor data room. */

export const PRIVACY_CONTACT = "info@northscale.capital";

export const RETENTION_PERIODS = {
  agreements: "Life of account + 7 years (regulatory record-keeping)",
  passport: "Life of account + 5 years after closure (AML/KYC obligations)",
  waiver: "Life of account + 7 years (regulatory record-keeping)",
};

export const LAWFUL_BASIS = {
  agreements: "Contract — necessary to provide services you requested",
  passport: "Legal obligation — identity verification & AML compliance",
  waiver: "Contract — required to access the investor platform",
};

export const DOCUMENT_PURPOSES = {
  agreements: "Electronic signature records for legal agreements you accepted during onboarding.",
  passport: "Government-issued ID stored for identity verification. Access is restricted and logged.",
  waiver: "Signed liability waiver archived in your personal data room.",
};

export const DATA_ROOM_NOTICE =
  "Your data room stores documents collected during onboarding. Each item is processed under our Privacy Policy for the stated purpose. Document access is logged for security and compliance.";

export const ID_UPLOAD_NOTICE =
  "We collect your passport or government ID solely to verify your identity and meet anti-money-laundering obligations. The document is stored securely, access is restricted to authorised personnel, and all views are logged.";

export const ID_CONSENT_LABEL =
  "I consent to the processing of my identification document for identity verification and compliance purposes, as described in the Privacy Policy. I understand I may withdraw consent by contacting support, subject to legal retention requirements.";

export const PROCESSORS_NOTE =
  "Documents may be mirrored to encrypted cloud storage (Microsoft OneDrive). See our Privacy Policy for full processor details.";

export const PRIVACY_REQUEST_TYPES = {
  export: {
    label: "Request data export",
    subject: "Data Export Request (GDPR Art. 15 / 20)",
    description: "Receive a copy of personal data we hold about you in a portable format.",
  },
  deletion: {
    label: "Request account deletion",
    subject: "Account Deletion Request (GDPR Art. 17)",
    description: "Request erasure of your account and personal data, subject to legal retention obligations.",
  },
  rectification: {
    label: "Request data correction",
    subject: "Data Rectification Request (GDPR Art. 16)",
    description: "Ask us to correct inaccurate personal information on your profile.",
  },
};