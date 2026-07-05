import React, { useEffect } from "react";
import SiteHeader from "../components/site/SiteHeader";
import MarketTicker from "../components/site/MarketTicker";
import FinancialNewsTicker from "@/components/portal/FinancialNewsTicker";
import HeroSection from "../components/site/HeroSection";
import FirmProfile from "../components/site/FirmProfile";
import ResearchFramework from "../components/site/ResearchFramework";
import WhoWeAre from "../components/site/WhoWeAre";
import NorthISection from "../components/site/NorthISection.jsx";
import PerformanceChart from "../components/site/PerformanceChart";
import StrategiesSection from "../components/site/StrategiesSection";
import RiskStatement from "../components/site/RiskStatement";
import SiteFooter from "../components/site/SiteFooter";
import ContactCTA from "../components/site/ContactCTA";

export default function Home() {
  useEffect(() => { document.title = "Home | North Scale"; }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-20 z-40 py-2 px-5 sm:px-8">
        <MarketTicker />
      </div>
      <main>
        <HeroSection />
        <FirmProfile />
        <ResearchFramework />
        <WhoWeAre />
        <NorthISection />
        <PerformanceChart />
        <StrategiesSection />
        <RiskStatement />
        <ContactCTA />
      </main>
      <div className="border-t border-border">
        <FinancialNewsTicker />
      </div>
      <SiteFooter />
    </div>
  );
}