import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import FinancialNewsTicker from "@/components/portal/FinancialNewsTicker";
import JobCard from "@/components/careers/JobCard.jsx";
import ApplicationForm from "@/components/careers/ApplicationForm.jsx";

const POSITIONS = [
{
  id: "quant-trader",
  title: "Quantitative Trader",
  location: "Amsterdam / Hybrid",
  employment: "Full-time",
  requirements: [
  "Minimum 8–10 years of professional quantitative trading experience.",
  "Extensive experience developing systematic trading strategies.",
  "Strong understanding of market microstructure and execution.",
  "Experience across futures, FX, commodities, digital assets or equity indices.",
  "Strong programming skills (Python, C++, Rust or similar).",
  "Deep understanding of statistics, probability and risk management.",
  "Proven track record of designing profitable quantitative models.",
  "Ability to work independently with high ownership."],

  preferred: [
  "Experience at proprietary trading firms, hedge funds or institutional investment firms.",
  "Experience managing multiple trading systems simultaneously."]

},
{
  id: "financial-accountant",
  title: "Financial Accountant",
  location: "Amsterdam",
  employment: "Full-time",
  requirements: [
  "Minimum 5 years of professional accounting experience.",
  "Bachelor's degree in Accounting, Finance or a related field (required).",
  "Experience preparing annual accounts and financial reporting.",
  "Knowledge of Dutch accounting and tax regulations.",
  "Experience with bookkeeping, reconciliations and financial administration.",
  "High attention to detail and accuracy.",
  "Excellent written and verbal communication skills in Dutch and English."],

  preferred: [
  "Experience within financial services, investment firms or asset management."]

}];


export default function Careers() {
  useEffect(() => { document.title = "Career | North Scale"; }, []);
  const [showApplication, setShowApplication] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");

  const handleApply = (positionTitle) => {
    setSelectedPosition(positionTitle);
    setShowApplication(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setShowApplication(false);
    setSelectedPosition("");
  };

  if (showApplication) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 pt-40 pb-20">
          <ApplicationForm
            selectedPosition={selectedPosition}
            onBack={handleBack}
            onSubmitSuccess={handleBack} />
          
        </main>
        <SiteFooter />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 pt-40 pb-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          
          {/* HERO */}
          <section className="border-b border-border pb-16 mb-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-6">
              careers
            </p>
            <h1 className="font-heading text-5xl leading-[0.90] tracking-tight text-foreground sm:text-7xl lg:text-8xl mb-6">join north scale.

            </h1>
            <p className="font-mono text-xs leading-7 text-muted-foreground max-w-2xl mt-8">
              We are building a small team of exceptional professionals with deep expertise in quantitative research, technology, and operations.
            </p>
            <a
              href="#positions"
              className="inline-block border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors duration-200 mt-12">
              
              View Open Positions
            </a>
          </section>

          {/* WHO WE ARE */}
          <section className="border-b border-border pb-16 mb-16">
            <div className="max-w-3xl">
              <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-6">
                who we are
              </h2>
              <p className="font-mono text-xs leading-7 text-muted-foreground">
                We believe exceptional results are produced by exceptional people. north scale operates with a long-term mindset, combining quantitative research, disciplined risk management, and technology to build proprietary trading systems across multiple asset classes. We hire selectively and maintain a small, highly specialized team.
              </p>
            </div>
          </section>

          {/* OPEN POSITIONS */}
          <section id="positions" className="border-b border-border pb-16 mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-8">
              open positions
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {POSITIONS.map((position) =>
              <JobCard
                key={position.id}
                position={position}
                onApply={() => handleApply(position.title)} />

              )}
            </div>
          </section>

          {/* WHY NORTH SCALE */}
          <section className="border-b border-border pb-16 mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-8">
              why north scale
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
              "Small, highly specialized team.",
              "High ownership and responsibility.",
              "Long-term approach to research.",
              "Technology-driven environment.",
              "Professional and confidential culture.",
              "International ambitions.",
              "Continuous research and development."].
              map((item, idx) =>
              <div
                key={idx}
                className="border border-border p-6">
                
                  <p className="font-mono text-xs leading-6 text-foreground">
                    {item}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* RECRUITMENT PROCESS */}
          <section className="border-b border-border pb-16 mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-8">
              recruitment process
            </h2>
            <div className="max-w-2xl">
              <div className="space-y-0">
                {[
                { step: 1, title: "Application Review", desc: "Initial review of your application and CV." },
                { step: 2, title: "Initial Interview", desc: "Conversation with our team to discuss your background and fit." },
                { step: 3, title: "Technical Assessment", desc: "Role-dependent evaluation of relevant skills." },
                { step: 4, title: "Final Interview", desc: "Meeting with senior team members." },
                { step: 5, title: "Offer", desc: "Employment proposal and onboarding." }].
                map((stage, idx) =>
                <div
                  key={stage.step}
                  className={`flex gap-6 py-6 ${idx !== 4 ? "border-b border-border" : ""}`}>
                  
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground w-8 flex-shrink-0">
                      {String(stage.step).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-mono text-xs text-foreground mb-1">{stage.title}</p>
                      <p className="font-mono text-[10px] leading-5 text-muted-foreground/70">{stage.desc}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* APPLICATION CTA */}
          <section>
            <div className="border border-border p-8 sm:p-12">
              <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-4">
                interested?
              </h2>
              <p className="font-mono text-xs leading-7 text-muted-foreground max-w-xl mb-8">
                If your experience aligns with one of the positions above, we invite you to submit your application. Every application is reviewed confidentially by our team.
              </p>
              <a
                href="#apply"
                onClick={(e) => {e.preventDefault();handleApply("");}}
                className="inline-block border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors">
                
                Submit Application
              </a>
            </div>
          </section>

        </div>
      </main>

      <div className="border-t border-border">
        <FinancialNewsTicker />
      </div>
      <SiteFooter />
    </div>);

}