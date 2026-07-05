import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function EconomicsData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await base44.functions.invoke("getEconomicsData", {});
        setData(response.data || []);
      } catch (error) {
        console.error("Error fetching economics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price, symbol, type) => {
    if (price === null || price === undefined) return "—";
    if (type === 'rate') return `${price.toFixed(2)}%`;
    if (symbol === 'VIX') return price.toFixed(2);
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (changePercent, type) => {
    if (changePercent === null || changePercent === undefined) return null;
    if (type === 'rate') return null;
    const sign = changePercent >= 0 ? "+" : "";
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getDirectionColor = (changePercent, type) => {
    if (type === 'rate') return "text-foreground";
    if (changePercent === null || changePercent === undefined) return "text-muted-foreground";
    if (changePercent > 0) return "text-green-400";
    if (changePercent < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  if (loading || data.length === 0) {
    return (
      <section className="border-b border-border bg-background py-4 overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="overflow-hidden">
            <div className="flex items-center gap-8 animate-marquee-reverse">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 flex-shrink-0">
                  <div className="h-3 w-12 bg-secondary animate-pulse" />
                  <div className="h-3 w-10 bg-secondary animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border bg-background py-4 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="overflow-hidden">
          <div className="flex items-center gap-8 animate-marquee-reverse">
            {[...data, ...data].map((item, idx) => (
              <div key={`${item.symbol}-${idx}`} className="flex items-center gap-3 px-2 flex-shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">{item.symbol}</span>
                <span className="font-mono text-[11px] font-medium text-foreground">{formatPrice(item.price, item.symbol, item.type)}</span>
                <span className={`font-mono text-[10px] font-medium ${getDirectionColor(item.changePercent, item.type)}`}>{formatChange(item.changePercent, item.type)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}