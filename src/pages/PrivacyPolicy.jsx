import React from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

const sections = [
  {
    number: "1",
    title: "Who We Are and About This Policy",
    content: [
      `1.1 This Privacy Policy (the "Policy") is issued by BDB Management Consultancy - FZCO, a company registered in the United Arab Emirates under Trade Licence No. 37691, with its registered office at IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates, which operates the "North Scale" brand ("North Scale", "we", "us" or "our").`,
      `1.2 For the purposes of applicable data-protection law, North Scale is the "controller" of the personal data it processes about you, meaning it decides how and why your data is processed, except where it processes data on behalf of another party, in which case it acts as a "processor" for that party.`,
      `1.3 We are committed to protecting your personal data and to handling it lawfully, fairly and transparently in accordance with applicable data-protection law, including, where applicable, Regulation (EU) 2016/679 (the General Data Protection Regulation, or "GDPR"), the UK GDPR, and Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data of the United Arab Emirates and its implementing regulations.`,
      `1.4 If you have any questions about this Policy or about how we use your personal data, you can contact us at info@northscale.capital. The contact details for privacy matters and complaints are set out in full in Section 19.`,
    ],
  },
  {
    number: "2",
    title: "Definitions",
    content: [
      `2.1 In this Policy, the following terms have the following meanings:`,
      `"Broker" means any third-party broker, exchange, dealer or execution venue with which you open or hold an account in connection with our services.`,
      `"Personal data" means any information relating to an identified or identifiable natural person.`,
      `"Processing" means any operation performed on personal data, such as collection, recording, storage, use, disclosure or erasure.`,
      `"Services" means our website, applications, dashboards, signals, content and related services made available by North Scale.`,
      `"Supervisory authority" means a public authority responsible for monitoring the application of data-protection law, such as a national data-protection authority in the European Economic Area or the relevant authority in the United Arab Emirates.`,
    ],
  },
  {
    number: "3",
    title: "Scope of This Policy",
    content: [
      `3.1 This Policy applies to personal data we collect through the Services, through our communications with you, and through your interactions with our website and online presence.`,
      `3.2 Our Services may link to, or operate alongside, third parties such as Brokers, payment providers and analytics providers. Those third parties act as independent controllers of the personal data they process and are responsible for it under their own privacy policies. This Policy does not cover their processing, and we encourage you to review their policies.`,
      `3.3 If you provide us with personal data about another person (for example a joint account holder), you confirm that you are entitled to do so and that you have informed them how their data will be used as described in this Policy.`,
    ],
  },
  {
    number: "4",
    title: "The Personal Data We Collect",
    content: [
      `4.1 We may collect and process the following categories of personal data about you:`,
      `(a) Identity and contact data: your name, email address, telephone number, postal address, country of residence, date of birth and similar details.`,
      `(b) Account data: your username, password (held in encrypted form), profile details, preferences and account settings.`,
      `(c) Verification and compliance data: information required to verify your identity, confirm your eligibility, and meet anti-money-laundering, sanctions and other legal obligations, where applicable, which may include identification documents and proof of address.`,
      `(d) Financial and transaction data: information about subscriptions, payments and fees, and limited information relating to your use of the Services. We do not hold your funds and do not require your Broker account password.`,
      `(e) Connection and technical data: where you connect a Broker account or an application programming interface (API), the technical information necessary to enable that connection; and IP address, device identifiers, browser type, operating system, language settings and similar technical data.`,
      `(f) Usage data: information about how you access and use the Services, including pages viewed, features used, dates and times of access, and referring sources.`,
      `(g) Communications data: the content and metadata of messages and correspondence you exchange with us, including support requests and survey responses.`,
      `(h) Marketing and preferences data: your preferences for receiving communications from us and your interactions with our marketing.`,
      `4.2 Where we ask you to provide personal data to comply with a legal obligation or to enter into or perform a contract with you, and you do not provide it, we may be unable to provide the relevant Service, and we will tell you if that is the case.`,
      `4.3 We do not seek to collect special categories of data (such as data about health, race or religion). Please do not provide such data to us unless we specifically request it.`,
    ],
  },
  {
    number: "5",
    title: "How We Collect Your Data",
    content: [
      `5.1 Directly from you. We collect most personal data directly from you when you create or manage an account, complete forms, subscribe to a service, contact us, or otherwise use the Services.`,
      `5.2 Automatically. When you use our website we automatically collect technical and usage data through cookies and similar technologies, as described in Section 7.`,
      `5.3 From third parties. We may receive personal data from third parties, including Brokers and integration partners (in connection with a connection you have enabled), identity-verification and fraud-prevention providers, analytics and advertising providers, and publicly available sources, where permitted by law.`,
    ],
  },
  {
    number: "6",
    title: "How and Why We Use Your Data, and Our Legal Bases",
    content: [
      `6.1 We use your personal data for the purposes set out below. Where the GDPR or UK GDPR applies, we rely on the legal bases indicated:`,
      `(a) To provide and administer the Services and your account, and to deliver content, signals and features you request (legal basis: performance of a contract with you).`,
      `(b) To operate, secure, maintain and improve the Services, including troubleshooting, testing, analytics, fraud prevention and network security (legal basis: our legitimate interests in running and improving a safe and effective business).`,
      `(c) To communicate with you, including sending service and administrative messages and responding to your enquiries (legal basis: performance of a contract or our legitimate interests).`,
      `(d) To send you marketing about our Services where you have consented or where we are otherwise permitted to do so (legal basis: consent, or our legitimate interests in promoting our business).`,
      `(e) To verify identity and carry out compliance checks, and to comply with legal and regulatory obligations, including record-keeping, anti-money-laundering, counter-terrorist-financing and sanctions requirements (legal basis: compliance with a legal obligation, and our legitimate interests).`,
      `(f) To process payments and manage subscriptions and fees (legal basis: performance of a contract).`,
      `(g) To establish, exercise or defend legal claims, enforce our terms and protect our rights, users, systems and the public (legal basis: our legitimate interests, and compliance with a legal obligation).`,
      `(h) For business transactions, such as a merger, acquisition, financing or reorganisation (legal basis: our legitimate interests).`,
      `6.2 Where we rely on legitimate interests, we carry out a balancing exercise to ensure those interests are not overridden by your rights and freedoms. You may ask us for more information about this assessment using the contact details in Section 19.`,
      `6.3 Where we rely on your consent, you may withdraw it at any time. Withdrawing consent does not affect the lawfulness of processing carried out before the withdrawal.`,
      `6.4 We may aggregate or anonymise personal data so that it no longer identifies you, and use that aggregated or anonymised data for any lawful purpose, including analytics and product development.`,
    ],
  },
  {
    number: "7",
    title: "Cookies and Similar Technologies",
    content: [
      `7.1 Our website uses cookies and similar technologies (such as pixels and local storage) to operate the site, remember your preferences, measure performance and, where you agree, to support analytics and marketing.`,
      `7.2 We use the following broad categories:`,
      `(a) Strictly necessary cookies, which are required for the website to function and cannot be switched off in our systems.`,
      `(b) Performance and analytics cookies, which help us understand how the website is used so we can improve it.`,
      `(c) Functional cookies, which remember your choices and preferences.`,
      `(d) Targeting and advertising cookies, which may be used to deliver and measure relevant marketing.`,
      `7.3 Where required by law, we place non-essential cookies only with your consent, which you can give, withdraw or change through our cookie banner or preference centre. You can also control cookies through your browser settings. Disabling some cookies may affect how the website functions.`,
      `7.4 Further detail may be provided in a separate Cookie Policy made available on our website.`,
    ],
  },
  {
    number: "8",
    title: "How We Share Your Data",
    content: [
      `8.1 We do not sell your personal data. We may share it with the following categories of recipients, in each case subject to appropriate safeguards:`,
      `(a) Service providers and processors who process data on our behalf and under our instructions, such as hosting, infrastructure, analytics, communications, payment and customer-support providers.`,
      `(b) Brokers and integration partners, where you choose to connect a Broker account or use a feature that involves them, to the extent necessary to enable that feature.`,
      `(c) Professional advisers, such as lawyers, auditors and accountants, where necessary for legitimate business purposes.`,
      `(d) Regulators, authorities and law-enforcement bodies, where required to comply with the law, regulation or a lawful request, or to protect our rights.`,
      `(e) Parties to a business transaction, such as a prospective buyer or investor, in connection with a merger, acquisition, financing or reorganisation, subject to confidentiality.`,
      `8.2 We require our processors to protect your data, to act only on our instructions, and to be bound by obligations consistent with this Policy and applicable law.`,
    ],
  },
  {
    number: "9",
    title: "International Transfers of Data",
    content: [
      `9.1 We are based in the United Arab Emirates, and your personal data may be processed in the UAE and in other countries, including by our service providers, whose data-protection laws may differ from those in your country of residence.`,
      `9.2 Where we transfer personal data that is protected by the GDPR or UK GDPR to a country that has not been recognised as providing an adequate level of protection, we put in place an appropriate safeguard, such as the European Commission's (or the UK's) standard contractual clauses, or rely on another lawful transfer mechanism.`,
      `9.3 Where the UAE Personal Data Protection Law applies, we transfer personal data outside the UAE only where a lawful basis for the transfer exists.`,
      `9.4 You may contact us for more information about the safeguards we use and, where available, to obtain a copy of them.`,
    ],
  },
  {
    number: "10",
    title: "How Long We Keep Your Data",
    content: [
      `10.1 We keep your personal data only for as long as necessary for the purposes for which it was collected, including to provide the Services, to comply with our legal, accounting, tax and regulatory obligations, to resolve disputes and to enforce our agreements.`,
      `10.2 To decide how long to keep data, we consider its nature and sensitivity, the potential risk of harm from unauthorised use or disclosure, the purposes for which we process it, and the applicable legal requirements. For example, we generally keep account data for the life of your account and for a period afterwards, and we keep records required for compliance for the period set by applicable law.`,
      `10.3 When personal data is no longer needed, we securely delete or anonymise it.`,
    ],
  },
  {
    number: "11",
    title: "How We Protect Your Data",
    content: [
      `11.1 We use appropriate technical and organisational measures designed to protect personal data against unauthorised or unlawful access, loss, misuse, alteration or disclosure. These may include access controls, encryption in transit, monitoring, and staff confidentiality obligations.`,
      `11.2 No method of transmission over the internet or method of storage is completely secure, and while we strive to protect your data we cannot guarantee its absolute security.`,
      `11.3 You are responsible for keeping your account credentials confidential and for any activity carried out under your account. You must notify us promptly if you believe your account has been compromised.`,
      `11.4 Where a personal-data breach is likely to result in a risk to your rights, we will notify the relevant supervisory authority and, where required, affected individuals, in accordance with applicable law.`,
    ],
  },
  {
    number: "12",
    title: "Automated Decision-Making and Profiling",
    content: [
      `12.1 Any signals, strategies or model positions we make available are general in nature and are not personal recommendations or solely automated decisions that produce legal effects concerning you or similarly significantly affect you.`,
      `12.2 We do not make decisions producing legal or similarly significant effects about you based solely on automated processing without a lawful basis. Where we ever did so, you would have the right to obtain human intervention, to express your point of view, and to contest the decision.`,
    ],
  },
  {
    number: "13",
    title: "Your Rights",
    content: [
      `13.1 Subject to applicable law and certain conditions and exemptions, you may have the following rights in relation to your personal data:`,
      `(a) Access: to be told whether we process your data and to receive a copy of it.`,
      `(b) Rectification: to have inaccurate data corrected and incomplete data completed.`,
      `(c) Erasure: to have your data deleted in certain circumstances.`,
      `(d) Restriction: to limit how we use your data in certain circumstances.`,
      `(e) Objection: to object to processing based on our legitimate interests, and to object to direct marketing at any time.`,
      `(f) Portability: to receive certain data in a structured, commonly used, machine-readable format and to have it transmitted to another controller where technically feasible.`,
      `(g) Withdraw consent: where processing is based on consent, to withdraw it at any time.`,
      `(h) Complain: to lodge a complaint with a supervisory authority, as described in Section 19.`,
    ],
  },
  {
    number: "14",
    title: "How to Exercise Your Rights",
    content: [
      `14.1 To exercise any of your rights, please contact us at info@northscale.capital or using the postal address in Section 19.`,
      `14.2 We may need to verify your identity before responding, to protect your data. We may ask for specific information to help us confirm who you are.`,
      `14.3 We will respond within the timeframe required by applicable law (for example, one month under the GDPR, which may be extended for complex requests). Exercising your rights is usually free, although we may charge a reasonable fee or decline a request that is manifestly unfounded or excessive, to the extent permitted by law.`,
    ],
  },
  {
    number: "15",
    title: "Marketing Communications",
    content: [
      `15.1 Where we send you marketing, we do so in accordance with applicable law and your preferences. You can opt out at any time by using the unsubscribe link in our messages or by contacting us.`,
      `15.2 Opting out of marketing does not affect service-related or administrative communications that are necessary to provide the Services or to comply with our legal obligations.`,
    ],
  },
  {
    number: "16",
    title: "Third-Party Links and Services",
    content: [
      `16.1 Our website may contain links to, or integrations with, third-party websites and services, including Brokers. We are not responsible for the privacy practices or content of those third parties. This Policy applies only to our processing, and we encourage you to read the privacy policies of any third party you interact with.`,
    ],
  },
  {
    number: "17",
    title: "Children",
    content: [
      `17.1 Our website and Services are not directed at, or intended for, anyone under 18 years of age, and we do not knowingly collect personal data from children. If you believe that a child has provided us with personal data, please contact us and we will take appropriate steps to delete it.`,
    ],
  },
  {
    number: "18",
    title: "Changes to This Policy",
    content: [
      `18.1 We may update this Policy from time to time. The version that applies is identified by the version number and effective date shown above. Where changes are material, we will take reasonable steps to notify you, for example by posting a notice on our website or contacting you. Your continued use of the website or Services after the effective date constitutes acceptance of the updated Policy.`,
    ],
  },
  {
    number: "19",
    title: "How to Contact Us and Complaints",
    content: [
      `19.1 If you have any questions about this Policy, wish to exercise your rights, or wish to make a complaint about how we handle your personal data, please contact us at info@northscale.capital, or by post to BDB Management Consultancy - FZCO, IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates.`,
      `19.2 We will do our best to resolve any concern you raise. Where the GDPR or UK GDPR applies, you also have the right to lodge a complaint with the data-protection supervisory authority in your country of residence or work. Where the UAE Personal Data Protection Law applies, you may contact the competent UAE data-protection authority. We would, however, appreciate the opportunity to address your concerns before you approach a supervisory authority.`,
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-40 pb-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          {/* Header */}
          <div className="border-b border-border pb-12 mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-muted-foreground mb-6">
              Legal
            </p>
            <h1 className="font-heading text-5xl leading-tight text-foreground sm:text-6xl lowercase">
              privacy policy
            </h1>
            <p className="mt-4 font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
              BDB Management Consultancy - FZCO (Trade Licence No. 37691) • Version 1.0 • Effective date: June 2026
            </p>
            <p className="mt-8 leading-8 text-muted-foreground max-w-2xl">
              Your privacy matters. This Privacy Policy explains how North Scale collects, uses, shares, transfers, retains and protects your personal data when you visit our website, create an account, communicate with us or use our services, and the rights you have over your data. Please read it carefully, together with our Terms of Use and, where you use our trading-related services, our User Agreement. If you do not agree with this Policy, please do not use our website or services.
            </p>
          </div>

          {/* Sections */}
          <div className="divide-y divide-border">
            {sections.map((section) => (
              <div key={section.number} className="py-10 grid gap-6 sm:grid-cols-12">
                <div className="sm:col-span-1">
                  <span className="font-mono text-xs text-muted-foreground">{section.number.padStart(2, "0")}</span>
                </div>
                <div className="sm:col-span-11">
                  <h2 className="font-heading text-2xl text-foreground mb-4 lowercase">{section.title}</h2>

                  {section.content && (
                    <div className="space-y-4">
                      {section.content.map((paragraph, i) => (
                        <p key={i} className="leading-7 text-muted-foreground">{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-12 border-t border-border pt-8">
            <p className="font-mono text-xs text-muted-foreground leading-6">
              This Privacy Policy should be read together with the Terms of Use and Disclaimer of North Scale.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}