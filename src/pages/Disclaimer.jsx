import React from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

const sections = [
  {
    number: "1",
    title: "About This Disclaimer",
    content: [
      `1.1 This Disclaimer applies to the North Scale website and its content (the "Website"), operated by BDB Management Consultancy - FZCO, a company registered in the United Arab Emirates under Trade Licence No. 37691, with its registered office at IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates ("North Scale", "we", "us" or "our").`,
      `1.2 This Disclaimer forms part of, and should be read together with, our Terms of Use, our Privacy Policy and (where you use our services) our User Agreement. If you do not accept this Disclaimer, you must not use the Website.`,
    ],
  },
  {
    number: "2",
    title: "General Information Only",
    content: [
      `2.1 All content on the Website, including software, trading strategies, signals, indicators, educational material, market commentary, examples and any other information, is provided for general informational and educational purposes only.`,
      `2.2 Nothing on the Website is intended to be, or should be relied upon as, professional advice of any kind.`,
    ],
  },
  {
    number: "3",
    title: "No Investment Advice",
    content: [
      `3.1 The content on the Website is not investment advice, a personal recommendation, investment research, or an offer, inducement or solicitation to buy, sell or hold any financial instrument. It does not take into account your personal circumstances, financial situation, objectives or risk tolerance, and it may not be suitable for you.`,
      `3.2 You are solely responsible for your own decisions, and you should obtain independent professional advice before making any financial decision.`,
    ],
  },
  {
    number: "4",
    title: "Not Regulated; No Regulated Service",
    content: [
      `4.1 North Scale is a brand operated by BDB Management Consultancy - FZCO, which holds a commercial licence for management consultancy issued in the IFZA free zone, Dubai, United Arab Emirates. North Scale is not a bank, broker, exchange, investment firm or financial adviser; it is not authorised or regulated as a financial-services or investment business by any financial-services regulator; and it does not provide any regulated financial or investment service.`,
      `4.2 You should not assume that any financial-services authorisation, client-money protection, investor-compensation scheme or financial ombudsman service applies, and none applies unless expressly confirmed in writing.`,
    ],
  },
  {
    number: "5",
    title: "No Guarantee of Results",
    content: [
      `5.1 We do not guarantee, represent or warrant any particular outcome, profit, income, yield, rate of return or level of "growth", or that any strategy, signal or activity will be profitable or will avoid or limit losses. Any figures or examples shown are illustrative only.`,
    ],
  },
  {
    number: "6",
    title: "Past and Simulated Performance",
    content: [
      `6.1 Past performance, historical track records, hypothetical results and back-tested or simulated results are not reliable indicators of future results. Simulated results have inherent limitations and do not reflect actual trading, the impact of market conditions, or the costs of executing real trades. Your actual results will differ and may result in loss.`,
    ],
  },
  {
    number: "7",
    title: "Risk Warning",
    content: [
      `7.1 Trading carries a high level of risk and may not be suitable for everyone. Leveraged products such as forex and CFDs can magnify both gains and losses. Crypto-assets can be highly volatile. You may lose some or all of your invested capital, and you should only trade with money you can afford to lose.`,
      `7.2 Further risk information is set out in our User Agreement and any risk disclosure made available with our services.`,
    ],
  },
  {
    number: "8",
    title: "Copy Trading and Brokers",
    content: [
      `8.1 Any copy trading, automated replication or execution of trades is a service provided and carried out by your broker through your own account. It is not operated, controlled or executed by North Scale.`,
      `8.2 Brokers and other third parties are independent and are solely responsible for their own services, authorisation and conduct. We are not responsible for their acts or omissions, and you are responsible for satisfying yourself that any broker you use is appropriately licensed and permitted to provide services to you.`,
    ],
  },
  {
    number: "9",
    title: "Commissions and Conflicts of Interest",
    content: [
      `9.1 You should assume that North Scale may receive commissions, rebates, introducing-broker fees, revenue share, affiliate fees or other remuneration from brokers or partners in connection with your account, your activity or your referrals, in addition to or instead of any fee you pay.`,
      `9.2 This may create a conflict of interest, because such remuneration may increase with trading activity. This does not make North Scale your adviser or agent.`,
    ],
  },
  {
    number: "10",
    title: "Testimonials and Examples",
    content: [
      `10.1 Any testimonials, reviews or examples shown on the Website reflect individual experiences and are not a guarantee that you will achieve the same or similar results. They are not independently verified unless stated, and they should not be relied upon as a promise of performance.`,
    ],
  },
  {
    number: "11",
    title: "Accuracy, Errors and Omissions",
    content: [
      `11.1 While we take reasonable care to keep the Website up to date, we make no representation or warranty that the content is accurate, complete, current or free from error. Market data and information may be delayed, incomplete or inaccurate. We may change or remove content at any time without notice.`,
    ],
  },
  {
    number: "12",
    title: "External Links and Third-Party Content",
    content: [
      `12.1 The Website may contain links to, or content from, third parties. We do not control, endorse or accept responsibility for third-party websites, services or content, and your use of them is at your own risk and subject to their terms.`,
    ],
  },
  {
    number: "13",
    title: "No Reliance",
    content: [
      `13.1 To the extent permitted by law, you agree that you do not rely on any content on the Website, and that we are not liable to you, in respect of any decision you make based on that content. Any reliance you place on the content is strictly at your own risk.`,
    ],
  },
  {
    number: "14",
    title: "Limitation of Liability",
    content: [
      `14.1 To the fullest extent permitted by applicable law, North Scale shall not be liable for any loss or damage, including any direct, indirect, incidental, special, consequential or punitive loss, or any loss of profit, revenue, data or goodwill, or any trading loss, arising out of or in connection with your use of, or reliance on, the Website or its content.`,
      `14.2 Nothing in this Disclaimer excludes or limits any liability that cannot lawfully be excluded or limited, including liability for fraud or fraudulent misrepresentation, for death or personal injury caused by negligence, or any statutory right of a consumer that may not be excluded under mandatory applicable law. Where you deal as a consumer, your statutory rights are not affected.`,
    ],
  },
  {
    number: "15",
    title: "Territorial Restrictions",
    content: [
      `15.1 The Website and our services are not directed at, intended for, or available to U.S. persons or persons located in the United States, and are not offered where to do so would be unlawful. You are responsible for ensuring that your use of the Website is lawful in your jurisdiction.`,
    ],
  },
  {
    number: "16",
    title: "Changes to This Disclaimer",
    content: [
      `16.1 We may update this Disclaimer from time to time. The version that applies is identified by the version number and effective date above. Your continued use of the Website after any update constitutes acceptance of the updated Disclaimer.`,
    ],
  },
  {
    number: "17",
    title: "How to Contact Us",
    content: [
      `17.1 If you have any questions about this Disclaimer, please contact us at info@northscale.capital, or by post to BDB Management Consultancy - FZCO, IFZA Business Park, DDP, PO Box 342001, Dubai, United Arab Emirates.`,
    ],
    contact: true,
  },
];

export default function Disclaimer() {
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
              website disclaimer
            </h1>
            <p className="mt-4 font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
              BDB Management Consultancy - FZCO (Trade Licence No. 37691) • Version 1.0 • Effective date: June 2026
            </p>
            <p className="mt-8 leading-8 text-muted-foreground max-w-2xl">
              Please read this Disclaimer carefully. Trading in foreign exchange, contracts for difference (CFDs), crypto-assets, shares and commodities is high-risk and may result in the loss of all of your invested capital. The North Scale website and its content are provided for general information only and are not investment advice. By using the website you accept this Disclaimer, which should be read together with our Terms of Use and, where you use our services, our User Agreement.
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
              This Disclaimer should be read together with the North Scale Privacy Policy and Terms of Use.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}