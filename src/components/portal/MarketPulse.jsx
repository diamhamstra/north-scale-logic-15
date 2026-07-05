import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const INSTRUMENTS = [
  { symbol: "BTCUSD", name: "Bitcoin", finnhubSymbol: "BINANCE:BTCUSDT", type: "crypto" },
  { symbol: "XAUUSD", name: "Gold", finnhubSymbol: "OANDA:XAU_USD", fallbackSymbol: "GLD", type: "forex" },
  { symbol: "NDX", name: "Nasdaq 100", finnhubSymbol: "QQQ", type: "index" },
  { symbol: "SPX", name: "S&P 500", finnhubSymbol: "SPY", type: "index" },
  { symbol: "EURUSD", name: "EUR/USD", finnhubSymbol: "OANDA:EUR_USD", fallbackSymbol: "FXE", type: "forex" },
  { symbol: "USOIL", name: "WTI Crude", finnhubSymbol: "USO", type: "commodity" },
  { symbol: "XAGUSD", name: "Silver", finnhubSymbol: "OANDA:XAG_USD", fallbackSymbol: "SLV", type: "forex" },
];

export default function MarketPulse() {
  return null; // Deprecated - use MarketTicker in header
}

export function MarketTicker() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      const response = await base44.functions.invoke("getMarketPulse", { instruments: INSTRUMENTS });
      setData(response.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price, symbol) => {
    if (price === null || price === undefined) return "—";
    const isCrypto = symbol.includes("BTC");
    const isForex = symbol.includes("EUR") || symbol.includes("XAU") || symbol.includes("XAG");
    const isIndex = symbol === "NDX" || symbol === "SPX";
    if (isCrypto) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (isForex) return price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    if (isIndex) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (changePercent) => {
    if (changePercent === null || changePercent === undefined) return null;
    const sign = changePercent >= 0 ? "+" : "";
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getDirectionColor = (changePercent) => {
    if (changePercent === null || changePercent === undefined) return "text-muted-foreground";
    if (changePercent > 0) return "text-green-400";
    if (changePercent < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  if (loading || data.length === 0) {
    return (
      <div className="overflow-hidden">
        <div className="flex items-center gap-6 animate-marquee">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className="h-3 w-12 bg-secondary animate-pulse" />
              <div className="h-3 w-10 bg-secondary animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-6 animate-marquee">
        {[...data, ...data].map((inst, idx) => (
          <div key={`${inst.symbol}-${idx}`} className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">{inst.name}</span>
            <span className="font-mono text-[10px] text-foreground">{formatPrice(inst.price, inst.symbol)}</span>
            <span className={`font-mono text-[9px] ${getDirectionColor(inst.changePercent)}`}>{formatChange(inst.changePercent)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}