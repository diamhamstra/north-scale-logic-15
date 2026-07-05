import React from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

const sections = [
  {
    number: "1",
    title: "About These Terms and Who We Are",
    content: [
      "1.1 The North Scale website is operated by BDB Management Consultancy - FZCO, a company registered in the United Arab Emirates under Trade Licence No. 37691, with its registered office at IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates ('North Scale', 'we', 'us' or 'our').",
      "1.2 These Terms of Use (the 'Terms') apply to your access to and use of our website, including its content, tools and information (the 'Website'). They are separate from, and in addition to, the User Agreement that governs the use of our trading-related services (the 'Service') and our Privacy Policy, each of which is incorporated into these Terms by reference.",
      "1.3 Please also read our Privacy Policy, which explains how we handle your personal data, and (if you use the Service) the User Agreement, which contains important risk warnings and disclaimers.",
    ],
  },
  {
    number: "2",
    title: "Definitions",
    content: [
      "2.1 In these Terms, the following terms have the following meanings:",
      "'Broker' means any third-party broker, exchange, dealer or execution venue with which you open or hold an account in connection with the Service.",
      "'Content' means all text, graphics, images, software, data, signals, strategies, commentary and other material made available on or through the Website.",
      "'Service' means our trading-related services, governed by the User Agreement, including any account, signals, copy-trading connection or API.",
      "'User Agreement' means the Liability Waiver, Risk Acknowledgement and User Agreement that governs the Service.",
      "'Website' means the North Scale website and all Content and functionality made available through it.",
    ],
  },
  {
    number: "3",
    title: "Acceptance of and Changes to These Terms",
    content: [
      "3.1 By accessing or using the Website you confirm that you accept these Terms and agree to comply with them. If you are using the Website on behalf of an organisation, you confirm that you have authority to bind that organisation.",
      "3.2 We may update these Terms from time to time, for example to reflect changes in our Website, our business or the law. The version that applies is identified by the version number and effective date shown above.",
      "3.3 Where changes are material, we will take reasonable steps to bring them to your attention. Your continued use of the Website after the effective date of any update constitutes acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the Website.",
    ],
  },
  {
    number: "4",
    title: "Eligibility and Territorial Restrictions",
    content: [
      "4.1 You confirm that you are at least 18 years old (or the age of majority in your jurisdiction, if higher) and have the legal capacity to agree to these Terms.",
      "4.2 No U.S. persons. The Website and the Service are not directed at, intended for, or available to U.S. persons or persons located in the United States, and are not offered in any jurisdiction where to do so would be unlawful. You represent that you are not a U.S. person and are not accessing the Website from the United States.",
      "4.3 You are responsible for ensuring that your access to and use of the Website is lawful in your jurisdiction, and for complying with all laws applicable to you. We may restrict or refuse access from any jurisdiction or to any person at our discretion.",
    ],
  },
  {
    number: "5",
    title: "The Website and the Service",
    content: [
      "5.1 The Website provides general information about North Scale, including software, trading strategies, signals, educational material and market commentary. The Website and its Content are provided for general information only.",
      "5.2 Use of the Service itself (including any account, signals, copy-trading connection, or connection to a Broker or an API) is governed by the separate User Agreement. You will be asked to accept the User Agreement before using the Service.",
      "5.3 Copy trading is the Broker's service. Any copy trading, automated replication or execution of trades is a service provided and carried out by your Broker through your own account, and is not operated, controlled or executed by North Scale.",
      "5.4 In the event of any conflict between these Terms and the User Agreement in relation to the Service, the User Agreement prevails.",
    ],
  },
  {
    number: "6",
    title: "Registration and Accounts",
    content: [
      "6.1 Some features of the Website may require you to register for an account. You agree to provide accurate, current and complete information and to keep it up to date.",
      "6.2 You are responsible for keeping your login details confidential and for all activity carried out under your account. You must notify us promptly of any unauthorised use or suspected breach of security.",
      "6.3 You must not share your account, allow others to use it, or use anyone else's account without permission. We may refuse, suspend or cancel an account, or require you to change your login details, where we reasonably consider it necessary.",
    ],
  },
  {
    number: "7",
    title: "Licence to Use the Website",
    content: [
      "7.1 We grant you a limited, non-exclusive, non-transferable, non-sublicensable and revocable licence to access and use the Website and its Content for your own personal, non-commercial purposes, subject to these Terms.",
      "7.2 All rights not expressly granted are reserved. Except as permitted by these Terms or by applicable law, you may not copy, reproduce, distribute, publish, modify, create derivative works from, publicly display, sell, license or otherwise commercially exploit the Website or its Content.",
    ],
  },
  {
    number: "8",
    title: "Acceptable Use",
    content: [
      "8.1 You agree not to use the Website:",
      "(a) in any way that breaches any applicable law or regulation, or that is fraudulent or has any unlawful or fraudulent purpose or effect;",
      "(b) to gain or attempt to gain unauthorised access to the Website, the server on which it is stored, or any server, computer or database connected to it;",
      "(c) to introduce any virus, trojan, worm, logic bomb or other material that is malicious or technologically harmful, or to attack the Website via a denial-of-service attack;",
      "(d) to scrape, harvest, data-mine, frame or systematically extract Content except as expressly permitted by us;",
      "(e) to interfere with, disrupt or impose an unreasonable load on the Website, its security or its underlying infrastructure;",
      "(f) to impersonate any person, or misrepresent your identity or affiliation with any person; or",
      "(g) in any manner that could damage, disable, overburden or impair the Website, or expose North Scale or other users to liability.",
      "8.2 We may report any breach of this Section to the relevant authorities and cooperate with them, including by disclosing your identity where required.",
    ],
  },
  {
    number: "9",
    title: "User Content and Submissions",
    content: [
      "9.1 If the Website allows you to submit content (for example feedback, comments or messages), you are responsible for that content and confirm that it is accurate, lawful, and does not infringe the rights of any third party.",
      "9.2 You grant us a non-exclusive, worldwide, royalty-free licence to use, store, reproduce and process content you submit to the extent necessary to operate the Website and provide the Services, and to use feedback you provide to improve our products and services.",
      "9.3 We may remove or refuse to publish any content you submit at our discretion, including where we consider it unlawful or in breach of these Terms.",
    ],
  },
  {
    number: "10",
    title: "Intellectual Property and Trade Marks",
    content: [
      "10.1 All intellectual property rights in the Website and its Content, including text, graphics, layout, software, databases, trading strategies and signals, belong to North Scale or its licensors and are protected by law. Nothing in these Terms transfers any such rights to you.",
      "10.2 'North Scale', our logo and other brand features are trade marks or brand features of North Scale. You may not use them without our prior written consent.",
      "10.3 If you believe any Content infringes your rights, please contact us using the details in Section 24 so we can investigate.",
    ],
  },
  {
    number: "11",
    title: "Information Only; No Investment Advice",
    content: [
      "11.1 The Content on the Website is provided for general information only. It is not investment advice, a personal recommendation, investment research, or an offer, inducement or solicitation to buy or sell any financial instrument, and it does not take into account your personal circumstances, financial situation, objectives or risk tolerance.",
      "11.2 North Scale is not a bank, broker, exchange, investment firm or financial adviser, is not authorised or regulated as a financial-services or investment business by any financial-services regulator, and does not provide any regulated financial or investment service. You should obtain independent professional advice before making any financial decision.",
    ],
  },
  {
    number: "12",
    title: "No Guarantee and Risk Warning",
    content: [
      "12.1 Trading in foreign exchange, contracts for difference (CFDs), crypto-assets, shares and commodities is high-risk and may result in the loss of all of your invested capital. Where leveraged products are used, losses may accumulate rapidly.",
      "12.2 Nothing on the Website guarantees any profit, income, return or result. Past performance, historical track records and back-tested or simulated results are not reliable indicators of future results, and your actual results will differ and may result in loss.",
      "12.3 Further risk information and important terms are set out in the User Agreement and any risk disclosure made available with the Service, which you should read before using the Service.",
    ],
  },
  {
    number: "13",
    title: "Third-Party Brokers, Partners, Links and Advertising",
    content: [
      "13.1 Each Broker and partner is an independent third party, solely responsible for its own services, authorisation, pricing, execution, custody of funds and conduct. North Scale does not control, employ or act as agent for any Broker, and is not responsible for their acts or omissions.",
      "13.2 Any copy trading or trade execution is performed by your Broker under your separate agreement with that Broker. You are responsible for satisfying yourself that any Broker you use is appropriately licensed and permitted to provide services to you.",
      "13.3 The Website may contain links to, references to, or advertising for third-party websites, services and resources. These are provided for convenience only; we do not endorse and are not responsible for them, and your use of them is at your own risk and subject to their terms.",
    ],
  },
  {
    number: "14",
    title: "Availability and Changes to the Website",
    content: [
      "14.1 We may change, update, suspend, withdraw or restrict the availability of all or part of the Website at any time, including for maintenance, security or legal reasons, and we may change the Content at any time.",
      "14.2 We do not guarantee that the Website, or any Content on it, will always be available, uninterrupted, timely, accurate or error-free. We are not liable to you if the Website is unavailable at any time or for any period.",
    ],
  },
  {
    number: "15",
    title: "Suspension and Termination of Access",
    content: [
      "15.1 We may suspend or terminate your access to the Website, with or without notice, where we reasonably believe you have breached these Terms, where required by law, or to protect the Website, our users or our rights.",
      "15.2 You may stop using the Website at any time. Any provision that by its nature should survive termination (including Sections 10, 11, 12 and 16 to 23) shall survive.",
    ],
  },
  {
    number: "16",
    title: "Disclaimer of Warranties",
    content: [
      "16.1 To the fullest extent permitted by applicable law, the Website and its Content are provided on an 'as is' and 'as available' basis, and we disclaim all warranties, conditions and representations of any kind, whether express or implied, including any implied warranties of satisfactory quality, merchantability, fitness for a particular purpose, accuracy, completeness, title and non-infringement, and any warranty that the Website will be uninterrupted, secure or error-free.",
      "16.2 This Section does not exclude any warranty or right that cannot lawfully be excluded, including the statutory rights of consumers.",
    ],
  },
  {
    number: "17",
    title: "Limitation of Liability",
    content: [
      "17.1 To the fullest extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential or punitive loss, or for any loss of profit, revenue, anticipated savings, business, opportunity, data or goodwill, whether arising in contract, tort (including negligence), breach of statutory duty or otherwise, arising out of or in connection with your use of, or inability to use, the Website or its Content.",
      "17.2 To the fullest extent permitted by applicable law, we shall not be liable for any loss or damage arising from your reliance on any Content, from any trading decision, or from the acts or omissions of any Broker or other third party.",
      "17.3 Matters not excluded. Nothing in these Terms excludes or limits any liability that cannot lawfully be excluded or limited, including liability for fraud or fraudulent misrepresentation, for death or personal injury caused by negligence, or any liability or statutory right of a consumer that may not be excluded under mandatory applicable law. Where you deal as a consumer, your statutory rights are not affected by these Terms.",
    ],
  },
  {
    number: "18",
    title: "Indemnity",
    content: [
      "18.1 To the fullest extent permitted by applicable law, you agree to indemnify and hold harmless North Scale and its directors, officers, employees and agents against any claims, losses, liabilities and reasonable costs (including reasonable legal fees) arising from your breach of these Terms, your misuse of the Website, your violation of any law, or your infringement of the rights of any third party. This Section does not apply to the extent the relevant loss is caused by our own fraud, wilful misconduct or gross negligence, or where it would be unenforceable against a consumer under mandatory law.",
    ],
  },
  {
    number: "19",
    title: "Force Majeure",
    content: [
      "19.1 We shall not be liable for any failure or delay in performance, or for any unavailability of the Website, caused by events beyond our reasonable control, including acts of God, war, terrorism, civil unrest, pandemic, government action, and failures of telecommunications, internet, hosting, electricity or third-party systems.",
    ],
  },
  {
    number: "20",
    title: "Privacy and Data Protection",
    content: [
      "20.1 We process personal data in accordance with our Privacy Policy, which forms part of these Terms by reference. Please read it to understand how we collect, use and protect your data and the rights you have.",
    ],
  },
  {
    number: "21",
    title: "Complaints",
    content: [
      "21.1 If you have a complaint about the Website, please contact us at info@northscale.capital. We will use reasonable efforts to acknowledge and resolve your complaint promptly and fairly.",
    ],
  },
  {
    number: "22",
    title: "Governing Law and Jurisdiction",
    content: [
      "22.1 These Terms and any dispute or claim arising out of or in connection with them or their subject matter (including non-contractual disputes) are governed by the laws of England and Wales.",
      "22.2 The courts of England and Wales shall have jurisdiction to settle any dispute, except that where you are a consumer you may also bring proceedings in the courts of your country of residence, and you benefit from the mandatory consumer-protection provisions of the law of that country to the extent required by applicable law.",
    ],
  },
  {
    number: "23",
    title: "General",
    content: [
      "23.1 Entire agreement. These Terms, together with the Privacy Policy and (for the Service) the User Agreement, constitute the entire agreement between you and North Scale regarding the Website and supersede any prior terms relating to it.",
      "23.2 Severability. If any provision is held to be invalid or unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, or, if it cannot be so modified, severed, and the remaining provisions shall continue in full force.",
      "23.3 No waiver. No failure or delay in exercising any right operates as a waiver of it, and no single or partial exercise prevents any further exercise.",
      "23.4 Assignment. You may not assign or transfer your rights under these Terms without our prior written consent. We may assign or transfer them to an affiliate or in connection with a merger, acquisition or reorganisation.",
      "23.5 Third parties. Except for North Scale's group companies and the persons it indemnifies, a person who is not a party to these Terms has no right to enforce them.",
      "23.6 Notices. We may give notice to you through the Website or by email. You may give notice to us using the contact details in Section 24.",
      "23.7 Language. These Terms are provided in English, which prevails over any translation to the extent permitted by law.",
    ],
  },
  {
    number: "24",
    title: "How to Contact Us",
    content: [
      "24.1 If you have any questions about these Terms, please contact us at info@northscale.capital, or by post to BDB Management Consultancy - FZCO, IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates.",
    ],
  },
];

export default function TermsOfUse() {
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
              terms of use
            </h1>
            <p className="mt-4 font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
              BDB Management Consultancy - FZCO (Trade Licence No. 37691) • Version 1.0 • Effective date: June 2026
            </p>
            <p className="mt-8 leading-8 text-muted-foreground max-w-2xl">
              Please read these Terms carefully. These Terms of Use govern your access to and use of the North Scale website and its content. By accessing or using the website you agree to these Terms. If you do not agree, you must not use the website. Your use of our trading-related services is governed by our separate User Agreement, and your personal data is handled in accordance with our Privacy Policy. These Terms contain disclaimers, a limitation of our liability and an indemnity.
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
              These Terms of Use should be read together with the Privacy Policy and Disclaimer of North Scale.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}