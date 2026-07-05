import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { openNewsletterModal } from "../../lib/newsletter";

const contacts = [
{ name: "General", email: "info@northscale.capital" },
{ name: "Legal", email: "legal@northscale.capital" },
{ name: "Capital", email: "finance@northscale.capital" }];


export default function ContactCTA() {
  return (
    <section className="border-t border-border bg-background py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">
              get in touch
            </p>
            <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
              speak directly with our team.
            </h2>
            <p className="mt-6 max-w-lg font-mono text-xs leading-7 text-muted-foreground">
              For allocation inquiries or institutional introductions, reach us directly or submit a formal inquiry.
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link
                to="/contact"
                className="inline-flex min-h-[44px] items-center gap-4 border border-foreground/40 px-6 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-colors duration-200 hover:bg-foreground/10 hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-foreground">SUBMIT A FORMAL INQUIRY


              </Link>
              





              
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <div className="divide-y divide-border border border-border">
              {contacts.map((contact) =>
              <div key={contact.email} className="px-6 py-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                    {contact.name}
                  </p>
                  <a
                  href={`mailto:${contact.email}`}
                  className="mt-3 block font-mono text-sm text-foreground transition-colors duration-200 hover:text-muted-foreground break-all tracking-[0.08em]">
                    {contact.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>);

}