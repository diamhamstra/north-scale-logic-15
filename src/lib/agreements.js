// Central config for all legal agreements required during onboarding.
// version bump here triggers "Action Required" re-signing in portal.

export const AGREEMENTS = [
  {
    key: "liability_waiver",
    title: "Liability Waiver",
    version: "1.0",
    required: true,
    hasEffectiveDate: true,
    file_url: "https://media.base44.com/files/public/6a27d53e3035691339832a43/0ad420f81_North_Scale_Liability_Waiver_final.docx",
    content: `north scale

LIABILITY WAIVER, RISK ACKNOWLEDGEMENT
AND USER AGREEMENT

Issued by BDB Management Consultancy - FZCO, trading as "north scale"
Registered in the United Arab Emirates, Trade Licence No. 37691 (IFZA Free Zone, Dubai)
Registered office: IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates

Version 1.0  ·  Effective date: {{EFFECTIVE_DATE}}

────────────────────────────────────────────────────────────

CONTENTS

1. Parties and Background
2. Definitions and Interpretation
3. Nature of the Service and Our Role
4. No Investment Advice; No Advisory or Fiduciary Relationship
5. Eligibility, Territorial Restrictions and Compliance
6. Broker Accounts and API Connections
7. Copy Trading and Signals
8. No Guarantee of Performance; Past and Simulated Results
9. Risk Disclosure and Assumption of Risk
10. Third-Party Brokers, Partners and Content
11. Fees, Remuneration and Conflicts of Interest
12. Intellectual Property and Licence
13. Acceptable Use
14. Data Protection
15. Suspension, Termination and Effect
16. Limitation of Liability and Indemnity
17. Governing Law and Dispute Resolution
18. General Provisions
19. Electronic Signature and Acceptance

────────────────────────────────────────────────────────────

1. PARTIES AND BACKGROUND

1.1 This Agreement is entered into between BDB Management Consultancy - FZCO, trading as "north scale" (registered in the UAE, Trade Licence No. 37691, IFZA Free Zone, Dubai), and the individual or entity accessing or using north scale's services ("you" or "Client").

1.2 By electronically signing this Agreement, you confirm that you have read, understood, and agree to be legally bound by all terms set out herein.

────────────────────────────────────────────────────────────

2. DEFINITIONS AND INTERPRETATION

"Agreement" means this Liability Waiver, Risk Acknowledgement and User Agreement, including all schedules and annexures.
"north scale" means BDB Management Consultancy - FZCO and its authorised personnel.
"Platform" means the Scale investor portal and all associated digital services provided by north scale.
"Research Engine" means a quantitative algorithmic trading strategy offered through the Platform.
"Broker Account" means any third-party brokerage account connected to the Platform via API or copy-trading mechanism.
"Copy Trading" means the automated or semi-automated replication of trade signals from north scale's research systems to your Broker Account.

────────────────────────────────────────────────────────────

3. NATURE OF THE SERVICE AND OUR ROLE

3.1 north scale provides access to algorithmic and quantitative research engines designed to generate automated trade signals. north scale operates as a technology and research provider, not as a licensed investment manager, financial adviser, or fund manager.

3.2 north scale does not hold, manage, or have custody of client funds at any time. All trading activity occurs within Broker Accounts held in the Client's own name with regulated third-party brokers.

3.3 north scale does not guarantee the execution, timing, or outcome of any trade signal. Signal transmission depends on third-party infrastructure, including broker APIs and copy-trading platforms.

────────────────────────────────────────────────────────────

4. NO INVESTMENT ADVICE; NO ADVISORY OR FIDUCIARY RELATIONSHIP

4.1 Nothing communicated by north scale — whether through the Platform, email, or any other channel — constitutes investment advice, a personal recommendation, or a solicitation to buy or sell any financial instrument.

4.2 No fiduciary, advisory, or client-money relationship exists between north scale and the Client. You are solely responsible for all investment decisions made in connection with your Broker Account.

4.3 You should obtain independent financial, legal, and tax advice from appropriately qualified professionals before using north scale's services.

────────────────────────────────────────────────────────────

5. ELIGIBILITY, TERRITORIAL RESTRICTIONS AND COMPLIANCE

5.1 You represent that you are at least 18 years of age, legally capable of entering binding contracts, and not subject to any legal prohibition on using services of this nature in your jurisdiction.

5.2 You are solely responsible for determining whether use of the Platform and connection to any Research Engine is lawful in your country of residence. north scale makes no representation that its services are available or lawful in all jurisdictions.

5.3 Residents of jurisdictions subject to international sanctions or financial restrictions (including, without limitation, Iran, North Korea, Syria, Cuba, and Russia) are prohibited from using the Platform.

5.4 You represent that you are an accredited, professional, sophisticated, or institutional investor as defined by applicable law in your jurisdiction, or that you are otherwise legally permitted to engage in leveraged or speculative financial instrument trading.

────────────────────────────────────────────────────────────

6. BROKER ACCOUNTS AND API CONNECTIONS

6.1 You are responsible for establishing and maintaining your own Broker Account with a third-party broker. north scale may recommend brokers but does not control, endorse, or take responsibility for the operations, solvency, or regulatory status of any third-party broker.

6.2 By connecting a Broker Account to the Platform, you authorise north scale to transmit trade signals to that account pursuant to your selected Research Engine settings.

6.3 north scale shall not be liable for losses arising from broker outages, API failures, execution latency, partial fills, margin calls, or any other operational characteristic of the Broker Account.

────────────────────────────────────────────────────────────

7. COPY TRADING AND SIGNALS

7.1 Copy trading involves the automatic replication of trade signals. You acknowledge that there may be a difference between signals generated by north scale's systems and the trades ultimately executed in your Broker Account due to latency, slippage, or broker restrictions.

7.2 Past signal performance — whether live or backtested — does not guarantee future results. Signal quality and frequency may vary materially across market conditions.

7.3 You retain full responsibility for monitoring your Broker Account and may disconnect the copy-trading link at any time.

────────────────────────────────────────────────────────────

8. NO GUARANTEE OF PERFORMANCE; PAST AND SIMULATED RESULTS

8.1 north scale makes no representation or warranty — express or implied — that any Research Engine will achieve its stated objectives, generate positive returns, or preserve capital.

8.2 All historical performance data presented on the Platform or in any communication is either (a) backtested and simulated on historical data, or (b) live results achieved under specific market conditions that may not recur. Neither category represents a reliable indicator of future performance.

8.3 Simulated and backtested results have inherent limitations: they do not account for real-world factors including transaction costs, slippage, liquidity constraints, and behavioural biases. Actual investor results may differ materially from any presented figures.

────────────────────────────────────────────────────────────

9. RISK DISCLOSURE AND ASSUMPTION OF RISK

9.1 Trading leveraged financial instruments — including foreign exchange, commodities, digital assets, and equity indices — involves a substantial risk of loss. You may lose your entire invested capital. You should not invest funds you cannot afford to lose.

9.2 You acknowledge and accept the following specific risks:

(a) Market Risk: Prices can move rapidly and without warning due to economic, political, or global events.
(b) Leverage Risk: Leverage amplifies both gains and losses. A small adverse price movement can result in a total loss of the amount invested.
(c) Algorithmic Risk: Automated systems may behave unexpectedly in atypical market conditions, including flash crashes, liquidity crises, or periods of extreme volatility.
(d) Digital Asset Risk: Cryptocurrency and digital asset markets are highly speculative, subject to regulatory uncertainty, and may experience total loss of value.
(e) Liquidity Risk: In certain market conditions, it may not be possible to exit positions at a fair price.
(f) Counterparty Risk: The insolvency or operational failure of a broker or technology provider may result in loss of assets.
(g) Operational Risk: Technology failures, connectivity issues, or cyber incidents may disrupt trading activity.
(h) Regulatory Risk: Changes in laws or regulations may adversely affect the services or your investments.

9.3 You confirm that you have carefully considered these risks and are willing to bear them as a condition of using north scale's services.

────────────────────────────────────────────────────────────

10. THIRD-PARTY BROKERS, PARTNERS AND CONTENT

10.1 north scale may provide links, referrals, or integrations to third-party brokers, technology platforms, and data providers. north scale has no control over the conduct of these third parties and accepts no liability for their acts or omissions.

10.2 Any referral or partnership arrangement north scale may have with a third party does not constitute an endorsement of that party's services or a guarantee of their suitability for your circumstances.

────────────────────────────────────────────────────────────

11. FEES, REMUNERATION AND CONFLICTS OF INTEREST

11.1 north scale may receive referral fees, introducing broker commissions, or revenue-sharing payments from third-party brokers or technology providers. These arrangements may create potential conflicts of interest.

11.2 You acknowledge that such arrangements exist and that north scale has disclosed them in general terms through this Agreement.

────────────────────────────────────────────────────────────

12. INTELLECTUAL PROPERTY AND LICENCE

12.1 All content on the Platform — including but not limited to algorithms, research methodologies, strategy documentation, branding, and software — is the exclusive intellectual property of north scale and its licensors.

12.2 north scale grants you a limited, non-exclusive, non-transferable licence to access and use the Platform for your personal investment monitoring purposes. You may not reverse-engineer, copy, distribute, or commercialise any Platform content.

────────────────────────────────────────────────────────────

13. ACCEPTABLE USE

13.1 You must not:
(a) Use the Platform for any unlawful purpose or in violation of any applicable law;
(b) Share your access credentials with any third party;
(c) Attempt to access any part of the Platform for which you are not authorised;
(d) Upload or transmit any malicious code, virus, or harmful content;
(e) Misrepresent your identity, financial status, or investor classification.

────────────────────────────────────────────────────────────

14. DATA PROTECTION

14.1 north scale will process your personal data in accordance with its Privacy Policy, which is incorporated into this Agreement by reference.

14.2 By signing this Agreement, you consent to the collection, storage, and processing of your personal and financial information for the purposes described in the Privacy Policy.

────────────────────────────────────────────────────────────

15. SUSPENSION, TERMINATION AND EFFECT

15.1 north scale may suspend or terminate your access to the Platform at any time, with or without cause, and without prior notice.

15.2 Termination does not affect any accrued rights or obligations of either party. Provisions relating to limitation of liability, intellectual property, and governing law survive termination.

────────────────────────────────────────────────────────────

16. LIMITATION OF LIABILITY AND INDEMNITY

16.1 To the maximum extent permitted by applicable law, north scale — including its directors, officers, employees, agents, and affiliates — shall not be liable for any:

(a) Direct loss of capital, profits, or investment value;
(b) Indirect, incidental, special, consequential, or punitive damages;
(c) Loss arising from your reliance on any information, signal, or recommendation provided by north scale;
(d) Loss arising from any broker action, inaction, or failure;
(e) Loss arising from system downtime, connectivity failure, or cyber incident.

16.2 You agree to indemnify and hold harmless north scale from and against any claims, losses, damages, liabilities, costs, and expenses arising from your breach of this Agreement or your use of the Platform.

────────────────────────────────────────────────────────────

17. GOVERNING LAW AND DISPUTE RESOLUTION

17.1 This Agreement is governed by the laws of the United Arab Emirates. The parties submit to the non-exclusive jurisdiction of the courts of the UAE for the resolution of any disputes.

17.2 The parties shall endeavour to resolve disputes through good-faith negotiation before commencing formal proceedings.

────────────────────────────────────────────────────────────

18. GENERAL PROVISIONS

18.1 If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

18.2 This Agreement constitutes the entire agreement between the parties regarding its subject matter and supersedes all prior agreements, representations, and understandings.

18.3 north scale reserves the right to update this Agreement at any time. Material amendments will be notified through the Platform and may require re-acceptance.

────────────────────────────────────────────────────────────

19. ELECTRONIC SIGNATURE AND ACCEPTANCE

By electronically signing below, you confirm that:

(a) You have read this Agreement in its entirety;
(b) You understand and accept all terms, including the risk disclosures and limitations of liability;
(c) Your electronic signature constitutes a legally binding signature for the purposes of this Agreement;
(d) The effective date of this Agreement is the date you provide below.

────────────────────────────────────────────────────────────`,
  },
  {
    key: "terms_of_use",
    title: "Terms of Use",
    version: "1.0",
    required: true,
    hasEffectiveDate: true,
    content: `NORTH SCALE

TERMS OF USE

Issued by BDB Management Consultancy - FZCO, trading as "North Scale"
Registered in the United Arab Emirates, Trade Licence No. 37691 (IFZA Free Zone, Dubai)
Registered office: IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates

Version 1.0  ·  Effective date: {{EFFECTIVE_DATE}}

Please read these Terms carefully. These Terms of Use govern your access to and use of the North Scale website and its content. By accessing or using the website you agree to these Terms. If you do not agree, you must not use the website. Your use of our trading-related services is governed by our separate User Agreement, and your personal data is handled in accordance with our Privacy Policy. These Terms contain disclaimers, a limitation of our liability and an indemnity.

────────────────────────────────────────────────────────────

1. ABOUT THESE TERMS AND WHO WE ARE

1.1 The North Scale website is operated by BDB Management Consultancy - FZCO, a company registered in the United Arab Emirates under Trade Licence No. 37691, with its registered office at IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates ("North Scale", "we", "us" or "our").

1.2 These Terms of Use (the "Terms") apply to your access to and use of our website, including its content, tools and information (the "Website"). They are separate from, and in addition to, the User Agreement that governs the use of our trading-related services (the "Service") and our Privacy Policy, each of which is incorporated into these Terms by reference.

1.3 Please also read our Privacy Policy, which explains how we handle your personal data, and (if you use the Service) the User Agreement, which contains important risk warnings and disclaimers.

────────────────────────────────────────────────────────────

2. DEFINITIONS

2.1 In these Terms, the following terms have the following meanings:

"Broker" means any third-party broker, exchange, dealer or execution venue with which you open or hold an account in connection with the Service.

"Content" means all text, graphics, images, software, data, signals, strategies, commentary and other material made available on or through the Website.

"Service" means our trading-related services, governed by the User Agreement, including any account, signals, copy-trading connection or API.

"User Agreement" means the Liability Waiver, Risk Acknowledgement and User Agreement that governs the Service.

"Website" means the North Scale website and all Content and functionality made available through it.

────────────────────────────────────────────────────────────

3. ACCEPTANCE OF AND CHANGES TO THESE TERMS

3.1 By accessing or using the Website you confirm that you accept these Terms and agree to comply with them. If you are using the Website on behalf of an organisation, you confirm that you have authority to bind that organisation.

3.2 We may update these Terms from time to time, for example to reflect changes in our Website, our business or the law. The version that applies is identified by the version number and effective date shown above.

3.3 Where changes are material, we will take reasonable steps to bring them to your attention. Your continued use of the Website after the effective date of any update constitutes acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the Website.

────────────────────────────────────────────────────────────

4. ELIGIBILITY AND TERRITORIAL RESTRICTIONS

4.1 You confirm that you are at least 18 years old (or the age of majority in your jurisdiction, if higher) and have the legal capacity to agree to these Terms.

4.2 No U.S. persons. The Website and the Service are not directed at, intended for, or available to U.S. persons or persons located in the United States, and are not offered in any jurisdiction where to do so would be unlawful. You represent that you are not a U.S. person and are not accessing the Website from the United States.

4.3 You are responsible for ensuring that your access to and use of the Website is lawful in your jurisdiction, and for complying with all laws applicable to you. We may restrict or refuse access from any jurisdiction or to any person at our discretion.

────────────────────────────────────────────────────────────

5. THE WEBSITE AND THE SERVICE

5.1 The Website provides general information about North Scale, including software, trading strategies, signals, educational material and market commentary. The Website and its Content are provided for general information only.

5.2 Use of the Service itself (including any account, signals, copy-trading connection, or connection to a Broker or an API) is governed by the separate User Agreement. You will be asked to accept the User Agreement before using the Service.

5.3 Copy trading is the Broker's service. Any copy trading, automated replication or execution of trades is a service provided and carried out by your Broker through your own account, and is not operated, controlled or executed by North Scale.

5.4 In the event of any conflict between these Terms and the User Agreement in relation to the Service, the User Agreement prevails.

────────────────────────────────────────────────────────────

6. REGISTRATION AND ACCOUNTS

6.1 Some features of the Website may require you to register for an account. You agree to provide accurate, current and complete information and to keep it up to date.

6.2 You are responsible for keeping your login details confidential and for all activity carried out under your account. You must notify us promptly of any unauthorised use or suspected breach of security.

6.3 You must not share your account, allow others to use it, or use anyone else's account without permission. We may refuse, suspend or cancel an account, or require you to change your login details, where we reasonably consider it necessary.

────────────────────────────────────────────────────────────

7. LICENCE TO USE THE WEBSITE

7.1 We grant you a limited, non-exclusive, non-transferable, non-sublicensable and revocable licence to access and use the Website and its Content for your own personal, non-commercial purposes, subject to these Terms.

7.2 All rights not expressly granted are reserved. Except as permitted by these Terms or by applicable law, you may not copy, reproduce, distribute, publish, modify, create derivative works from, publicly display, sell, license or otherwise commercially exploit the Website or its Content.

────────────────────────────────────────────────────────────

8. ACCEPTABLE USE

8.1 You agree not to use the Website:
(a) in any way that breaches any applicable law or regulation, or that is fraudulent or has any unlawful or fraudulent purpose or effect;
(b) to gain or attempt to gain unauthorised access to the Website, the server on which it is stored, or any server, computer or database connected to it;
(c) to introduce any virus, trojan, worm, logic bomb or other material that is malicious or technologically harmful, or to attack the Website via a denial-of-service attack;
(d) to scrape, harvest, data-mine, frame or systematically extract Content except as expressly permitted by us;
(e) to interfere with, disrupt or impose an unreasonable load on the Website, its security or its underlying infrastructure;
(f) to impersonate any person, or misrepresent your identity or affiliation with any person; or
(g) in any manner that could damage, disable, overburden or impair the Website, or expose North Scale or other users to liability.

8.2 We may report any breach of this Section to the relevant authorities and cooperate with them, including by disclosing your identity where required.

────────────────────────────────────────────────────────────

9. USER CONTENT AND SUBMISSIONS

9.1 If the Website allows you to submit content (for example feedback, comments or messages), you are responsible for that content and confirm that it is accurate, lawful, and does not infringe the rights of any third party.

9.2 You grant us a non-exclusive, worldwide, royalty-free licence to use, store, reproduce and process content you submit to the extent necessary to operate the Website and provide the Services, and to use feedback you provide to improve our products and services.

9.3 We may remove or refuse to publish any content you submit at our discretion, including where we consider it unlawful or in breach of these Terms.

────────────────────────────────────────────────────────────

10. INTELLECTUAL PROPERTY AND TRADE MARKS

10.1 All intellectual property rights in the Website and its Content, including text, graphics, layout, software, databases, trading strategies and signals, belong to North Scale or its licensors and are protected by law. Nothing in these Terms transfers any such rights to you.

10.2 "North Scale", our logo and other brand features are trade marks or brand features of North Scale. You may not use them without our prior written consent.

10.3 If you believe any Content infringes your rights, please contact us using the details in Section 24 so we can investigate.

────────────────────────────────────────────────────────────

11. INFORMATION ONLY; NO INVESTMENT ADVICE

11.1 The Content on the Website is provided for general information only. It is not investment advice, a personal recommendation, investment research, or an offer, inducement or solicitation to buy or sell any financial instrument, and it does not take into account your personal circumstances, financial situation, objectives or risk tolerance.

11.2 North Scale is not a bank, broker, exchange, investment firm or financial adviser, is not authorised or regulated as a financial-services or investment business by any financial-services regulator, and does not provide any regulated financial or investment service. You should obtain independent professional advice before making any financial decision.

────────────────────────────────────────────────────────────

12. NO GUARANTEE AND RISK WARNING

12.1 Trading in foreign exchange, contracts for difference (CFDs), crypto-assets, shares and commodities is high-risk and may result in the loss of all of your invested capital. Where leveraged products are used, losses may accumulate rapidly.

12.2 Nothing on the Website guarantees any profit, income, return or result. Past performance, historical track records and back-tested or simulated results are not reliable indicators of future results, and your actual results will differ and may result in loss.

12.3 Further risk information and important terms are set out in the User Agreement and any risk disclosure made available with the Service, which you should read before using the Service.

────────────────────────────────────────────────────────────

13. THIRD-PARTY BROKERS, PARTNERS, LINKS AND ADVERTISING

13.1 Each Broker and partner is an independent third party, solely responsible for its own services, authorisation, pricing, execution, custody of funds and conduct. North Scale does not control, employ or act as agent for any Broker, and is not responsible for their acts or omissions.

13.2 Any copy trading or trade execution is performed by your Broker under your separate agreement with that Broker. You are responsible for satisfying yourself that any Broker you use is appropriately licensed and permitted to provide services to you.

13.3 The Website may contain links to, references to, or advertising for third-party websites, services and resources. These are provided for convenience only; we do not endorse and are not responsible for them, and your use of them is at your own risk and subject to their terms.

────────────────────────────────────────────────────────────

14. AVAILABILITY AND CHANGES TO THE WEBSITE

14.1 We may change, update, suspend, withdraw or restrict the availability of all or part of the Website at any time, including for maintenance, security or legal reasons, and we may change the Content at any time.

14.2 We do not guarantee that the Website, or any Content on it, will always be available, uninterrupted, timely, accurate or error-free. We are not liable to you if the Website is unavailable at any time or for any period.

────────────────────────────────────────────────────────────

15. SUSPENSION AND TERMINATION OF ACCESS

15.1 We may suspend or terminate your access to the Website, with or without notice, where we reasonably believe you have breached these Terms, where required by law, or to protect the Website, our users or our rights.

15.2 You may stop using the Website at any time. Any provision that by its nature should survive termination (including Sections 10, 11, 12 and 16 to 23) shall survive.

────────────────────────────────────────────────────────────

16. DISCLAIMER OF WARRANTIES

16.1 To the fullest extent permitted by applicable law, the Website and its Content are provided on an "as is" and "as available" basis, and we disclaim all warranties, conditions and representations of any kind, whether express or implied, including any implied warranties of satisfactory quality, merchantability, fitness for a particular purpose, accuracy, completeness, title and non-infringement, and any warranty that the Website will be uninterrupted, secure or error-free.

16.2 This Section does not exclude any warranty or right that cannot lawfully be excluded, including the statutory rights of consumers.

────────────────────────────────────────────────────────────

17. LIMITATION OF LIABILITY

17.1 To the fullest extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential or punitive loss, or for any loss of profit, revenue, anticipated savings, business, opportunity, data or goodwill, whether arising in contract, tort (including negligence), breach of statutory duty or otherwise, arising out of or in connection with your use of, or inability to use, the Website or its Content.

17.2 To the fullest extent permitted by applicable law, we shall not be liable for any loss or damage arising from your reliance on any Content, from any trading decision, or from the acts or omissions of any Broker or other third party.

17.3 Matters not excluded. Nothing in these Terms excludes or limits any liability that cannot lawfully be excluded or limited, including liability for fraud or fraudulent misrepresentation, for death or personal injury caused by negligence, or any liability or statutory right of a consumer that may not be excluded under mandatory applicable law. Where you deal as a consumer, your statutory rights are not affected by these Terms.

────────────────────────────────────────────────────────────

18. INDEMNITY

18.1 To the fullest extent permitted by applicable law, you agree to indemnify and hold harmless North Scale and its directors, officers, employees and agents against any claims, losses, liabilities and reasonable costs (including reasonable legal fees) arising from your breach of these Terms, your misuse of the Website, your violation of any law, or your infringement of the rights of any third party. This Section does not apply to the extent the relevant loss is caused by our own fraud, wilful misconduct or gross negligence, or where it would be unenforceable against a consumer under mandatory law.

────────────────────────────────────────────────────────────

19. FORCE MAJEURE

19.1 We shall not be liable for any failure or delay in performance, or for any unavailability of the Website, caused by events beyond our reasonable control, including acts of God, war, terrorism, civil unrest, pandemic, government action, and failures of telecommunications, internet, hosting, electricity or third-party systems.

────────────────────────────────────────────────────────────

20. PRIVACY AND DATA PROTECTION

20.1 We process personal data in accordance with our Privacy Policy, which forms part of these Terms by reference. Please read it to understand how we collect, use and protect your data and the rights you have.

────────────────────────────────────────────────────────────

21. COMPLAINTS

21.1 If you have a complaint about the Website, please contact us at info@northscale.capital. We will use reasonable efforts to acknowledge and resolve your complaint promptly and fairly.

────────────────────────────────────────────────────────────

22. GOVERNING LAW AND JURISDICTION

22.1 These Terms and any dispute or claim arising out of or in connection with them or their subject matter (including non-contractual disputes) are governed by the laws of England and Wales.

22.2 The courts of England and Wales shall have jurisdiction to settle any dispute, except that where you are a consumer you may also bring proceedings in the courts of your country of residence, and you benefit from the mandatory consumer-protection provisions of the law of that country to the extent required by applicable law.

────────────────────────────────────────────────────────────

23. GENERAL

23.1 Entire agreement. These Terms, together with the Privacy Policy and (for the Service) the User Agreement, constitute the entire agreement between you and North Scale regarding the Website and supersede any prior terms relating to it.

23.2 Severability. If any provision is held to be invalid or unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, or, if it cannot be so modified, severed, and the remaining provisions shall continue in full force.

23.3 No waiver. No failure or delay in exercising any right operates as a waiver of it, and no single or partial exercise prevents any further exercise.

23.4 Assignment. You may not assign or transfer your rights under these Terms without our prior written consent. We may assign or transfer them to an affiliate or in connection with a merger, acquisition or reorganisation.

23.5 Third parties. Except for North Scale's group companies and the persons it indemnifies, a person who is not a party to these Terms has no right to enforce them.

23.6 Notices. We may give notice to you through the Website or by email. You may give notice to us using the contact details in Section 24.

23.7 Language. These Terms are provided in English, which prevails over any translation to the extent permitted by law.

────────────────────────────────────────────────────────────

24. HOW TO CONTACT US

24.1 If you have any questions about these Terms, please contact us at info@northscale.capital, or by post to BDB Management Consultancy - FZCO, IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates.`,
  },
  {
    key: "privacy_policy",
    title: "Privacy Policy",
    version: "1.0",
    required: true,
    hasEffectiveDate: true,
    content: `NORTH SCALE

PRIVACY POLICY

Issued by BDB Management Consultancy - FZCO, trading as "North Scale"
Registered in the United Arab Emirates, Trade Licence No. 37691 (IFZA Free Zone, Dubai)
Registered office: IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates

Version 1.0  ·  Effective date: {{EFFECTIVE_DATE}}

Your privacy matters. This Privacy Policy explains how North Scale collects, uses, shares, transfers, retains and protects your personal data when you visit our website, create an account, communicate with us or use our services, and the rights you have over your data. Please read it carefully, together with our Terms of Use and, where you use our trading-related services, our User Agreement. If you do not agree with this Policy, please do not use our website or services.

────────────────────────────────────────────────────────────

1. WHO WE ARE AND ABOUT THIS POLICY

1.1 This Privacy Policy (the "Policy") is issued by BDB Management Consultancy - FZCO, a company registered in the United Arab Emirates under Trade Licence No. 37691, with its registered office at IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates, which operates the "North Scale" brand ("North Scale", "we", "us" or "our").

1.2 For the purposes of applicable data-protection law, North Scale is the "controller" of the personal data it processes about you, meaning it decides how and why your data is processed, except where it processes data on behalf of another party, in which case it acts as a "processor" for that party.

1.3 We are committed to protecting your personal data and to handling it lawfully, fairly and transparently in accordance with applicable data-protection law, including, where applicable, Regulation (EU) 2016/679 (the General Data Protection Regulation, or "GDPR"), the UK GDPR, and Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data of the United Arab Emirates and its implementing regulations.

1.4 If you have any questions about this Policy or about how we use your personal data, you can contact us at info@northscale.capital. The contact details for privacy matters and complaints are set out in full in Section 19.

────────────────────────────────────────────────────────────

2. DEFINITIONS

2.1 In this Policy, the following terms have the following meanings:

"Broker" means any third-party broker, exchange, dealer or execution venue with which you open or hold an account in connection with our services.

"Personal data" means any information relating to an identified or identifiable natural person.

"Processing" means any operation performed on personal data, such as collection, recording, storage, use, disclosure or erasure.

"Services" means our website, applications, dashboards, signals, content and related services made available by North Scale.

"Supervisory authority" means a public authority responsible for monitoring the application of data-protection law, such as a national data-protection authority in the European Economic Area or the relevant authority in the United Arab Emirates.

────────────────────────────────────────────────────────────

3. SCOPE OF THIS POLICY

3.1 This Policy applies to personal data we collect through the Services, through our communications with you, and through your interactions with our website and online presence.

3.2 Our Services may link to, or operate alongside, third parties such as Brokers, payment providers and analytics providers. Those third parties act as independent controllers of the personal data they process and are responsible for it under their own privacy policies. This Policy does not cover their processing, and we encourage you to review their policies.

3.3 If you provide us with personal data about another person (for example a joint account holder), you confirm that you are entitled to do so and that you have informed them how their data will be used as described in this Policy.

────────────────────────────────────────────────────────────

4. THE PERSONAL DATA WE COLLECT

4.1 We may collect and process the following categories of personal data about you:

(a) Identity and contact data: your name, email address, telephone number, postal address, country of residence, date of birth and similar details.

(b) Account data: your username, password (held in encrypted form), profile details, preferences and account settings.

(c) Verification and compliance data: information required to verify your identity, confirm your eligibility, and meet anti-money-laundering, sanctions and other legal obligations, where applicable, which may include identification documents and proof of address.

(d) Financial and transaction data: information about subscriptions, payments and fees, and limited information relating to your use of the Services. We do not hold your funds and do not require your Broker account password.

(e) Connection and technical data: where you connect a Broker account or an application programming interface (API), the technical information necessary to enable that connection; and IP address, device identifiers, browser type, operating system, language settings and similar technical data.

(f) Usage data: information about how you access and use the Services, including pages viewed, features used, dates and times of access, and referring sources.

(g) Communications data: the content and metadata of messages and correspondence you exchange with us, including support requests and survey responses.

(h) Marketing and preferences data: your preferences for receiving communications from us and your interactions with our marketing.

4.2 Where we ask you to provide personal data to comply with a legal obligation or to enter into or perform a contract with you, and you do not provide it, we may be unable to provide the relevant Service, and we will tell you if that is the case.

4.3 We do not seek to collect special categories of data (such as data about health, race or religion). Please do not provide such data to us unless we specifically request it.

────────────────────────────────────────────────────────────

5. HOW WE COLLECT YOUR DATA

5.1 Directly from you. We collect most personal data directly from you when you create or manage an account, complete forms, subscribe to a service, contact us, or otherwise use the Services.

5.2 Automatically. When you use our website we automatically collect technical and usage data through cookies and similar technologies, as described in Section 7.

5.3 From third parties. We may receive personal data from third parties, including Brokers and integration partners (in connection with a connection you have enabled), identity-verification and fraud-prevention providers, analytics and advertising providers, and publicly available sources, where permitted by law.

────────────────────────────────────────────────────────────

6. HOW AND WHY WE USE YOUR DATA, AND OUR LEGAL BASES

6.1 We use your personal data for the purposes set out below. Where the GDPR or UK GDPR applies, we rely on the legal bases indicated:

(a) To provide and administer the Services and your account, and to deliver content, signals and features you request (legal basis: performance of a contract with you).

(b) To operate, secure, maintain and improve the Services, including troubleshooting, testing, analytics, fraud prevention and network security (legal basis: our legitimate interests in running and improving a safe and effective business).

(c) To communicate with you, including sending service and administrative messages and responding to your enquiries (legal basis: performance of a contract or our legitimate interests).

(d) To send you marketing about our Services where you have consented or where we are otherwise permitted to do so (legal basis: consent, or our legitimate interests in promoting our business).

(e) To verify identity and carry out compliance checks, and to comply with legal and regulatory obligations, including record-keeping, anti-money-laundering, counter-terrorist-financing and sanctions requirements (legal basis: compliance with a legal obligation, and our legitimate interests).

(f) To process payments and manage subscriptions and fees (legal basis: performance of a contract).

(g) To establish, exercise or defend legal claims, enforce our terms and protect our rights, users, systems and the public (legal basis: our legitimate interests, and compliance with a legal obligation).

(h) For business transactions, such as a merger, acquisition, financing or reorganisation (legal basis: our legitimate interests).

6.2 Where we rely on legitimate interests, we carry out a balancing exercise to ensure those interests are not overridden by your rights and freedoms. You may ask us for more information about this assessment using the contact details in Section 19.

6.3 Where we rely on your consent, you may withdraw it at any time. Withdrawing consent does not affect the lawfulness of processing carried out before the withdrawal.

6.4 We may aggregate or anonymise personal data so that it no longer identifies you, and use that aggregated or anonymised data for any lawful purpose, including analytics and product development.

────────────────────────────────────────────────────────────

7. COOKIES AND SIMILAR TECHNOLOGIES

7.1 Our website uses cookies and similar technologies (such as pixels and local storage) to operate the site, remember your preferences, measure performance and, where you agree, to support analytics and marketing.

7.2 We use the following broad categories:

(a) Strictly necessary cookies, which are required for the website to function and cannot be switched off in our systems.

(b) Performance and analytics cookies, which help us understand how the website is used so we can improve it.

(c) Functional cookies, which remember your choices and preferences.

(d) Targeting and advertising cookies, which may be used to deliver and measure relevant marketing.

7.3 Where required by law, we place non-essential cookies only with your consent, which you can give, withdraw or change through our cookie banner or preference centre. You can also control cookies through your browser settings. Disabling some cookies may affect how the website functions.

7.4 Further detail may be provided in a separate Cookie Policy made available on our website.

────────────────────────────────────────────────────────────

8. HOW WE SHARE YOUR DATA

8.1 We do not sell your personal data. We may share it with the following categories of recipients, in each case subject to appropriate safeguards:

(a) Service providers and processors who process data on our behalf and under our instructions, such as hosting, infrastructure, analytics, communications, payment and customer-support providers.

(b) Brokers and integration partners, where you choose to connect a Broker account or use a feature that involves them, to the extent necessary to enable that feature.

(c) Professional advisers, such as lawyers, auditors and accountants, where necessary for legitimate business purposes.

(d) Regulators, authorities and law-enforcement bodies, where required to comply with the law, regulation or a lawful request, or to protect our rights.

(e) Parties to a business transaction, such as a prospective buyer or investor, in connection with a merger, acquisition, financing or reorganisation, subject to confidentiality.

8.2 We require our processors to protect your data, to act only on our instructions, and to be bound by obligations consistent with this Policy and applicable law.

────────────────────────────────────────────────────────────

9. INTERNATIONAL TRANSFERS OF DATA

9.1 We are based in the United Arab Emirates, and your personal data may be processed in the UAE and in other countries, including by our service providers, whose data-protection laws may differ from those in your country of residence.

9.2 Where we transfer personal data that is protected by the GDPR or UK GDPR to a country that has not been recognised as providing an adequate level of protection, we put in place an appropriate safeguard, such as the European Commission's (or the UK's) standard contractual clauses, or rely on another lawful transfer mechanism.

9.3 Where the UAE Personal Data Protection Law applies, we transfer personal data outside the UAE only where a lawful basis for the transfer exists.

9.4 You may contact us for more information about the safeguards we use and, where available, to obtain a copy of them.

────────────────────────────────────────────────────────────

10. HOW LONG WE KEEP YOUR DATA

10.1 We keep your personal data only for as long as necessary for the purposes for which it was collected, including to provide the Services, to comply with our legal, accounting, tax and regulatory obligations, to resolve disputes and to enforce our agreements.

10.2 To decide how long to keep data, we consider its nature and sensitivity, the potential risk of harm from unauthorised use or disclosure, the purposes for which we process it, and the applicable legal requirements. For example, we generally keep account data for the life of your account and for a period afterwards, and we keep records required for compliance for the period set by applicable law.

10.3 When personal data is no longer needed, we securely delete or anonymise it.

────────────────────────────────────────────────────────────

11. HOW WE PROTECT YOUR DATA

11.1 We use appropriate technical and organisational measures designed to protect personal data against unauthorised or unlawful access, loss, misuse, alteration or disclosure. These may include access controls, encryption in transit, monitoring, and staff confidentiality obligations.

11.2 No method of transmission over the internet or method of storage is completely secure, and while we strive to protect your data we cannot guarantee its absolute security.

11.3 You are responsible for keeping your account credentials confidential and for any activity carried out under your account. You must notify us promptly if you believe your account has been compromised.

11.4 Where a personal-data breach is likely to result in a risk to your rights, we will notify the relevant supervisory authority and, where required, affected individuals, in accordance with applicable law.

────────────────────────────────────────────────────────────

12. AUTOMATED DECISION-MAKING AND PROFILING

12.1 Any signals, strategies or model positions we make available are general in nature and are not personal recommendations or solely automated decisions that produce legal effects concerning you or similarly significantly affect you.

12.2 We do not make decisions producing legal or similarly significant effects about you based solely on automated processing without a lawful basis. Where we ever did so, you would have the right to obtain human intervention, to express your point of view, and to contest the decision.

────────────────────────────────────────────────────────────

13. YOUR RIGHTS

13.1 Subject to applicable law and certain conditions and exemptions, you may have the following rights in relation to your personal data:

(a) Access: to be told whether we process your data and to receive a copy of it.

(b) Rectification: to have inaccurate data corrected and incomplete data completed.

(c) Erasure: to have your data deleted in certain circumstances.

(d) Restriction: to limit how we use your data in certain circumstances.

(e) Objection: to object to processing based on our legitimate interests, and to object to direct marketing at any time.

(f) Portability: to receive certain data in a structured, commonly used, machine-readable format and to have it transmitted to another controller where technically feasible.

(g) Withdraw consent: where processing is based on consent, to withdraw it at any time.

(h) Complain: to lodge a complaint with a supervisory authority, as described in Section 19.

────────────────────────────────────────────────────────────

14. HOW TO EXERCISE YOUR RIGHTS

14.1 To exercise any of your rights, please contact us at info@northscale.capital or using the postal address in Section 19.

14.2 We may need to verify your identity before responding, to protect your data. We may ask for specific information to help us confirm who you are.

14.3 We will respond within the timeframe required by applicable law (for example, one month under the GDPR, which may be extended for complex requests). Exercising your rights is usually free, although we may charge a reasonable fee or decline a request that is manifestly unfounded or excessive, to the extent permitted by law.

────────────────────────────────────────────────────────────

15. MARKETING COMMUNICATIONS

15.1 Where we send you marketing, we do so in accordance with applicable law and your preferences. You can opt out at any time by using the unsubscribe link in our messages or by contacting us.

15.2 Opting out of marketing does not affect service-related or administrative communications that are necessary to provide the Services or to comply with our legal obligations.

────────────────────────────────────────────────────────────

16. THIRD-PARTY LINKS AND SERVICES

16.1 Our website may contain links to, or integrations with, third-party websites and services, including Brokers. We are not responsible for the privacy practices or content of those third parties. This Policy applies only to our processing, and we encourage you to read the privacy policies of any third party you interact with.

────────────────────────────────────────────────────────────

17. CHILDREN

17.1 Our website and Services are not directed at, or intended for, anyone under 18 years of age, and we do not knowingly collect personal data from children. If you believe that a child has provided us with personal data, please contact us and we will take appropriate steps to delete it.

────────────────────────────────────────────────────────────

18. CHANGES TO THIS POLICY

18.1 We may update this Policy from time to time. The version that applies is identified by the version number and effective date shown above. Where changes are material, we will take reasonable steps to notify you, for example by posting a notice on our website or contacting you. Your continued use of the website or Services after the effective date constitutes acceptance of the updated Policy.

────────────────────────────────────────────────────────────

19. HOW TO CONTACT US AND COMPLAINTS

19.1 If you have any questions about this Policy, wish to exercise your rights, or wish to make a complaint about how we handle your personal data, please contact us at info@northscale.capital, or by post to BDB Management Consultancy - FZCO, IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates.

19.2 We will do our best to resolve any concern you raise. Where the GDPR or UK GDPR applies, you also have the right to lodge a complaint with the data-protection supervisory authority in your country of residence or work. Where the UAE Personal Data Protection Law applies, you may contact the competent UAE data-protection authority. We would, however, appreciate the opportunity to address your concerns before you approach a supervisory authority.`,
  },
  {
    key: "risk_disclosure",
    title: "Risk Disclosure",
    version: "1.0",
    required: true,
    content: `north scale CAPITAL — RISK DISCLOSURE STATEMENT

Version 1.0 | Effective Date: 2024

IMPORTANT NOTICE: THIS RISK DISCLOSURE STATEMENT IS PROVIDED TO ENSURE THAT YOU UNDERSTAND THE RISKS ASSOCIATED WITH PARTICIPATION IN north scale'S INVESTMENT STRATEGIES.

1. GENERAL RISK WARNING

Trading and investing in financial instruments involves significant risk of loss. The value of investments can fall as well as rise. You may not recover the amount originally invested. Leverage, where applicable, can magnify both gains and losses.

2. MARKET RISK

Financial markets are subject to continuous change driven by economic, political, and global events. Prices can move rapidly and unpredictably. Market conditions may prevent execution of orders at desired prices, resulting in slippage or unfilled orders.

3. FOREIGN EXCHANGE RISK

Investments denominated in foreign currencies are subject to exchange rate fluctuations. Changes in currency values may adversely affect the value of your investment independently of the underlying asset performance.

4. COMMODITIES RISK

Commodity markets are subject to unique risks including weather events, geopolitical disruptions, supply and demand imbalances, and regulatory changes. Commodity prices can be highly volatile and subject to manipulation.

5. DIGITAL ASSET RISK

Digital assets, including cryptocurrencies, are highly speculative and volatile. They are subject to regulatory uncertainty, technological vulnerabilities, exchange failures, and potential total loss of value. Digital asset markets operate 24/7 and may experience extreme price swings over short periods.

6. ALGORITHM AND MODEL RISK

Quantitative trading strategies rely on mathematical models and algorithms. These models may contain errors, may not perform as expected in all market conditions, or may fail entirely. Past backtested or live performance of any algorithm does not guarantee future performance.

7. LIQUIDITY RISK

In certain market conditions, it may be difficult or impossible to exit positions at a fair price. Illiquid markets may result in significant losses upon forced liquidation.

8. COUNTERPARTY RISK

Trading through brokers and financial intermediaries involves counterparty risk. The insolvency, fraud, or operational failure of a counterparty could result in the loss of your assets.

9. OPERATIONAL RISK

Systems, software, and technology can fail. Connectivity issues, platform outages, or cyber incidents may disrupt trading activity and result in losses.

10. REGULATORY RISK

Laws and regulations governing financial services and investment activities may change. Such changes may adversely affect the operations of north scale Capital and the value of your investments.

11. CONCENTRATION RISK

Investment in a limited number of strategies, instruments, or markets increases the risk of significant loss if those strategies or markets underperform.

12. ILLUSTRATIVE PERFORMANCE DATA

All performance figures presented by north scale Capital, unless specifically noted as verified live results, are illustrative or backtested. Backtested results are simulated and do not represent actual returns achieved by investors. Hypothetical performance results have inherent limitations and should not be relied upon.

BY SIGNING THIS RISK DISCLOSURE STATEMENT, YOU CONFIRM THAT YOU HAVE READ AND UNDERSTOOD ALL OF THE RISKS DESCRIBED ABOVE AND THAT YOU ACCEPT THESE RISKS AS A CONDITION OF YOUR PARTICIPATION IN north scale CAPITAL'S INVESTMENT PROGRAMS.`,
  },
];

export const AGREEMENT_KEYS = AGREEMENTS.map(a => a.key);

export function getAgreement(key) {
  return AGREEMENTS.find(a => a.key === key);
}

/** Parse one agreement record from DB (string, object, or double-encoded JSON). */
export function parseAgreementRecord(record) {
  if (record == null || record === "") return null;
  let parsed = record;
  for (let i = 0; i < 2; i += 1) {
    if (typeof parsed !== "string") break;
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  return parsed;
}

/** Normalize agreements_signed map from InvestorProfile into parsed objects keyed by agreement key. */
export function normalizeAgreementsSigned(agreementsSigned) {
  if (!agreementsSigned) return {};
  let map = agreementsSigned;
  if (typeof map === "string") {
    try {
      map = JSON.parse(map);
    } catch {
      return {};
    }
  }
  if (typeof map !== "object" || map === null || Array.isArray(map)) return {};
  const result = {};
  for (const [key, val] of Object.entries(map)) {
    const parsed = parseAgreementRecord(val);
    if (parsed) result[key] = parsed;
  }
  return result;
}

/** Drop heavy PNG data URLs before DB storage; PDF lives at document_url. */
export function compactAgreementRecord(record) {
  if (!record || typeof record !== "object") return record;
  const { signature_value: _sig, ...rest } = record;
  return rest;
}

export function serializeAgreementsSigned(parsedMap) {
  const toStore = {};
  Object.entries(parsedMap || {}).forEach(([k, v]) => {
    toStore[k] = JSON.stringify(compactAgreementRecord(v));
  });
  return toStore;
}

export function allAgreementsSigned(agreementsSigned) {
  const signed = normalizeAgreementsSigned(agreementsSigned);
  return AGREEMENTS.filter(a => a.required).every(a => {
    const parsed = signed[a.key];
    return parsed?.version === a.version && !!parsed?.signed_at;
  });
}

export function getAgreementsNeedingAction(agreementsSigned) {
  const signed = normalizeAgreementsSigned(agreementsSigned);
  return AGREEMENTS.filter(a => {
    if (!a.required) return false;
    const parsed = signed[a.key];
    if (!parsed) return true;
    return parsed.version !== a.version;
  });
}