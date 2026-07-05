import React from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

const sections = [
  {
    number: "1",
    title: "What Are Cookies",
    content: "Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to website operators. Cookies do not contain personally identifiable information on their own, but may be linked to personal information we hold about you.",
  },
  {
    number: "2",
    title: "How We Use Cookies",
    intro: "North Scale Capital uses cookies and similar technologies to:",
    items: [
      "Ensure the website functions correctly",
      "Analyze how visitors use the website",
      "Remember user preferences and settings",
      "Maintain website security",
      "Improve the overall user experience",
    ],
  },
  {
    number: "3",
    title: "Types of Cookies We Use",
    subsections: [
      {
        title: "Strictly Necessary Cookies",
        content: "These cookies are essential for the website to function and cannot be disabled. They are usually set in response to actions you take, such as setting privacy preferences or navigating the website. Without these cookies, the website cannot operate properly.",
      },
      {
        title: "Analytics Cookies",
        content: "These cookies allow us to count visits and understand how visitors interact with the website. All information collected is aggregated and anonymous. These cookies help us improve how our website works.",
      },
      {
        title: "Functional Cookies",
        content: "These cookies enable the website to provide enhanced functionality and personalization, such as remembering preferences. They may be set by us or by third-party providers whose services we use.",
      },
    ],
  },
  {
    number: "4",
    title: "Third-Party Cookies",
    content: "Some cookies on our website may be set by third-party services, such as analytics providers. We do not control these cookies and they are subject to the respective third party's privacy policy. We encourage you to review the privacy policies of any third-party services accessed through our website.",
  },
  {
    number: "5",
    title: "Managing Cookies",
    intro: "You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by:",
    items: [
      "Adjusting your browser settings to refuse or delete cookies",
      "Using our cookie consent tool when first visiting the website",
      "Opting out of specific analytics or third-party cookies",
    ],
    outro: "Please note that disabling certain cookies may affect the functionality of our website. Most browsers allow you to manage cookies through their settings. Refer to your browser's help documentation for guidance.",
  },
  {
    number: "6",
    title: "Cookie Retention",
    content: "Session cookies are temporary and are deleted when you close your browser. Persistent cookies remain on your device for a set period or until manually deleted. The retention period of each cookie depends on its purpose and the entity that set it.",
  },
  {
    number: "7",
    title: "Changes to This Cookie Policy",
    content: 'North Scale Capital may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our practices. Any updates will be posted on this page with a revised "Last Updated" date.',
  },
  {
    number: "8",
    title: "Contact",
    contact: true,
  },
];

export default function CookiePolicy() {
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
            <h1 className="font-heading text-5xl leading-tight text-foreground sm:text-6xl">
              Cookie Policy
            </h1>
            <p className="mt-4 font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
              North Scale Capital — Last Updated: June 2026
            </p>
            <p className="mt-8 leading-8 text-muted-foreground max-w-2xl">
              This Cookie Policy explains how North Scale Capital uses cookies and similar technologies when you visit our website at northscale.capital. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
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
                  <h2 className="font-heading text-2xl text-foreground mb-4">{section.title}</h2>

                  {section.content && (
                    <p className="leading-7 text-muted-foreground">{section.content}</p>
                  )}

                  {section.intro && (
                    <p className="leading-7 text-muted-foreground mb-3">{section.intro}</p>
                  )}

                  {section.items && (
                    <ul className="space-y-2 mb-4">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 font-mono text-xs text-muted-foreground">
                          <span className="mt-1 h-px w-4 bg-border flex-shrink-0 inline-block" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.outro && (
                    <p className="leading-7 text-muted-foreground mt-3">{section.outro}</p>
                  )}

                  {section.subsections && section.subsections.map((sub, i) => (
                    <div key={i} className="mt-6">
                      <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-foreground mb-2">{sub.title}</h3>
                      <p className="leading-7 text-muted-foreground">{sub.content}</p>
                    </div>
                  ))}

                  {section.contact && (
                    <div className="border border-border p-6 mt-2">
                      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">North Scale Capital</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Email:{" "}
                        <a href="mailto:info@northscale.capital" className="text-foreground hover:text-muted-foreground transition-colors">
                          info@northscale.capital
                        </a>
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-2">
                        Website:{" "}
                        <a href="https://northscale.capital" className="text-foreground hover:text-muted-foreground transition-colors">
                          northscale.capital
                        </a>
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
              This Cookie Policy should be read together with the North Scale Privacy Policy, Terms of Use, and Disclaimer.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}