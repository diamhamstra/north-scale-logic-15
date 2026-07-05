import React from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

const sections = [
  {
    number: "1",
    title: "About This Notice",
    content: [
      `1.1 This GDPR Data Protection Notice (the "Notice") is issued by BDB Management Consultancy - FZCO, a company registered in the United Arab Emirates under Trade Licence No. 37691, with its registered office at IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates, which operates the "North Scale" brand ("North Scale", "we", "us" or "our").`,
      `1.2 This Notice sets out, in a focused way, the information required by Articles 13 and 14 of the GDPR. Our full Privacy Policy contains further detail about how we handle personal data, and forms part of this Notice by reference.`,
    ],
  },
  {
    number: "2",
    title: "When This Notice Applies",
    content: [
      `2.1 This Notice applies where the GDPR or the UK GDPR applies to our processing of your personal data, including where you are located in the European Economic Area (the "EEA") or the United Kingdom and we offer our services to you or monitor your behaviour there.`,
      `2.2 Our services are not directed at U.S. persons or persons in the United States. This Notice does not limit any additional rights you may have under the data-protection law of the United Arab Emirates or another country.`,
    ],
  },
  {
    number: "3",
    title: "Data Controller and Contact",
    content: [
      `3.1 North Scale is the controller of the personal data it processes about you for the purposes described in this Notice, meaning it determines the purposes and means of that processing.`,
      `3.2 You can contact us about data-protection matters at info@northscale.capital, or by post to BDB Management Consultancy - FZCO, IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates.`,
    ],
  },
  {
    number: "4",
    title: "Categories of Personal Data We Process",
    content: [
      `4.1 Depending on how you interact with us, we may process: identity and contact data; account and profile data; verification and compliance data; financial and transaction data; connection and technical data (including IP address and device data); usage data; communications data; and marketing and preferences data. These categories are described more fully in our Privacy Policy.`,
      `4.2 We do not seek to process special categories of personal data, and we ask that you do not provide such data to us unless we specifically request it.`,
    ],
  },
  {
    number: "5",
    title: "Purposes and Legal Bases",
    content: [
      `5.1 Under Article 6(1) of the GDPR, we process your personal data on the following legal bases:`,
      `(a) Performance of a contract (Article 6(1)(b)): to provide and administer the services and your account, and to respond to your requests.`,
      `(b) Legitimate interests (Article 6(1)(f)): to operate, secure and improve the services, to prevent fraud and misuse, to carry out analytics, to market our services to existing users, and to protect and enforce our rights, as further described in Section 6.`,
      `(c) Compliance with a legal obligation (Article 6(1)(c)): to meet record-keeping, anti-money-laundering, sanctions and other legal and regulatory requirements.`,
      `(d) Consent (Article 6(1)(a)): for certain marketing and for non-essential cookies, where required. You may withdraw your consent at any time.`,
      `5.2 Where we need to collect personal data by law, or to enter into or perform a contract with you, and you do not provide it, we may be unable to provide the relevant service.`,
    ],
  },
  {
    number: "6",
    title: "Our Legitimate Interests",
    content: [
      `6.1 Where we rely on legitimate interests, those interests include running, securing and improving a reliable service, understanding how our services are used, preventing fraud and abuse, marketing responsibly, and establishing, exercising or defending legal claims.`,
      `6.2 We carry out a balancing assessment to ensure our legitimate interests are not overridden by your interests, rights and freedoms. You may ask us for information about this assessment, and you have the right to object to this processing, as described in Section 10.`,
    ],
  },
  {
    number: "7",
    title: "Recipients and Processors",
    content: [
      `7.1 We may share your personal data with service providers and processors that act on our behalf and under our instructions, with brokers and integration partners where you enable a connection, with professional advisers, with regulators and authorities where required by law, and with parties to a business transaction. We do not sell your personal data.`,
      `7.2 Where a third party processes personal data on our behalf, we put in place a written contract that meets the requirements of Article 28 of the GDPR.`,
    ],
  },
  {
    number: "8",
    title: "International Transfers",
    content: [
      `8.1 We are based in the United Arab Emirates, and your personal data may be transferred to and processed in the UAE and other countries outside the EEA or the United Kingdom.`,
      `8.2 Where we transfer personal data protected by the GDPR or UK GDPR to a country that is not the subject of an adequacy decision, we rely on an appropriate safeguard under Chapter V of the GDPR, such as the European Commission's standard contractual clauses (or the UK's international data transfer agreement or addendum). You may contact us to obtain information about these safeguards and, where available, a copy.`,
    ],
  },
  {
    number: "9",
    title: "How Long We Keep Your Data",
    content: [
      `9.1 We keep personal data only for as long as necessary for the purposes for which it was collected, including to provide the services, to comply with legal, accounting, tax and regulatory obligations, to resolve disputes and to enforce our agreements. When data is no longer needed, we securely delete or anonymise it.`,
    ],
  },
  {
    number: "10",
    title: "Your Rights Under the GDPR",
    content: [
      `10.1 Subject to the conditions and exemptions in the GDPR, you have the following rights:`,
      `(a) Access (Article 15): to obtain confirmation that we process your data and a copy of it.`,
      `(b) Rectification (Article 16): to have inaccurate data corrected and incomplete data completed.`,
      `(c) Erasure (Article 17): to have your data deleted in certain circumstances.`,
      `(d) Restriction (Article 18): to restrict our processing in certain circumstances.`,
      `(e) Data portability (Article 20): to receive certain data in a structured, commonly used, machine-readable format and to have it transmitted to another controller where technically feasible.`,
      `(f) Objection (Article 21): to object to processing based on legitimate interests, and to object to direct marketing at any time.`,
      `(g) Rights regarding automated decisions (Article 22): as described in Section 13.`,
    ],
  },
  {
    number: "11",
    title: "How to Exercise Your Rights",
    content: [
      `11.1 To exercise any of your rights, please contact us at info@northscale.capital. We may need to verify your identity before responding, in order to protect your data.`,
      `11.2 We will respond without undue delay and within one month of receiving your request, as required by Article 12 of the GDPR. That period may be extended by up to two further months for complex or numerous requests, and we will tell you if that is the case. Exercising your rights is generally free, although we may charge a reasonable fee or refuse to act where a request is manifestly unfounded or excessive, to the extent permitted by law.`,
    ],
  },
  {
    number: "12",
    title: "Withdrawing Your Consent",
    content: [
      `12.1 Where we rely on your consent, you may withdraw it at any time by contacting us or by using the controls provided (for example the unsubscribe link in marketing emails or the cookie preference centre). Withdrawing consent does not affect the lawfulness of processing carried out before the withdrawal.`,
    ],
  },
  {
    number: "13",
    title: "Automated Decision-Making and Profiling",
    content: [
      `13.1 We do not make decisions that produce legal effects concerning you, or that similarly significantly affect you, based solely on automated processing without a lawful basis. Any signals or strategies we provide are general and are not personal recommendations.`,
      `13.2 Where we ever carried out solely automated decision-making within the meaning of Article 22 of the GDPR, you would have the right to obtain human intervention, to express your point of view, and to contest the decision.`,
    ],
  },
  {
    number: "14",
    title: "Your Right to Lodge a Complaint",
    content: [
      `14.1 If you consider that our processing of your personal data infringes the GDPR or UK GDPR, you have the right under Article 77 to lodge a complaint with a supervisory authority, in particular in the EEA or UK country of your habitual residence, place of work or the place of the alleged infringement.`,
      `14.2 We would, however, appreciate the opportunity to address your concerns before you approach a supervisory authority, so please consider contacting us first.`,
    ],
  },
  {
    number: "15",
    title: "Changes and How to Contact Us",
    content: [
      `15.1 We may update this Notice from time to time. The version that applies is identified by the version number and effective date above, and material changes will be notified as described in our Privacy Policy.`,
      `15.2 For any question about this Notice or your rights, contact us at info@northscale.capital, or by post to BDB Management Consultancy - FZCO, IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates.`,
    ],
    contact: true,
  },
];

export default function GdprNotice() {
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
              gdpr data protection notice
            </h1>
            <p className="mt-4 font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
              BDB Management Consultancy - FZCO (Trade Licence No. 37691) • Version 1.0 • Effective date: June 2026
            </p>
            <p className="mt-8 leading-8 text-muted-foreground max-w-2xl">
              For visitors in the EEA and the UK. This Notice explains how North Scale processes your personal data and the rights you have under the EU General Data Protection Regulation (Regulation (EU) 2016/679, the "GDPR") and the UK GDPR. It supplements, and should be read together with, our Privacy Policy. Where this Notice and the Privacy Policy address the same matter, they are intended to be read consistently.
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
                  <div className="space-y-4">
                    {section.content.map((paragraph, i) => (
                      <p key={i} className="leading-7 text-muted-foreground">{paragraph}</p>
                    ))}
                  </div>
                  {section.contact && (
                    <div className="border border-border p-6 mt-6">
                      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">North Scale</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Email:{" "}
                        <a href="mailto:info@northscale.capital" className="text-foreground hover:text-muted-foreground transition-colors">
                          info@northscale.capital
                        </a>
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-2">
                        Post: BDB Management Consultancy - FZCO, IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-12 border-t border-border pt-8">
            <p className="font-mono text-xs text-muted-foreground leading-6">
              This Notice should be read together with the North Scale Privacy Policy, Terms of Use, and Disclaimer.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}