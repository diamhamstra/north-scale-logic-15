import React, { useEffect } from "react";
import SiteHeader from "../components/site/SiteHeader";
import ContactForm from "../components/site/ContactForm";
import SiteFooter from "../components/site/SiteFooter";
import FinancialNewsTicker from "@/components/portal/FinancialNewsTicker";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border pt-40 pb-20">
          <div className="technical-grid absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-12 items-end">
              <div className="lg:col-span-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-6">Contact</p>
                <h1 className="font-heading text-5xl leading-[0.90] tracking-tight text-foreground sm:text-7xl lg:text-8xl mb-6">institutional & strategic inquiries.

                </h1>
                <p className="font-mono text-xs leading-7 text-muted-foreground max-w-xl">
                  Our team reviews all inquiries and responds within 1–3 business days.
                </p>
              </div>
              <div className="lg:col-span-4 lg:col-start-9">
                <div className="border border-border divide-y divide-border">
                  <div className="px-6 py-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">General Inquiries</p>
                    <a href="mailto:info@northscale.capital" className="font-heading text-xl text-foreground hover:text-muted-foreground transition-colors">
                      info@northscale.capital
                    </a>
                  </div>
                  <div className="px-6 py-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">Response Time</p>
                    <p className="font-mono text-xs text-foreground">1–3 business days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-16 lg:grid-cols-12">
              {/* Form */}
              <div className="lg:col-span-12">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="border-t border-border">
        <FinancialNewsTicker />
      </div>
      <SiteFooter />
    </div>);

}