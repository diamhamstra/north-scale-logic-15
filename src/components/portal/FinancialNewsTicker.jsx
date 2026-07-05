import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const NEWS_CATEGORIES = ["forex", "crypto", "general"];

export default function FinancialNewsTicker() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      const allNews = [];
      for (const category of NEWS_CATEGORIES) {
        const res = await base44.functions.invoke("marketData", {
          endpoint: "news",
          params: { category, from: new Date().toISOString().split("T")[0] },
        });
        if (res?.data && Array.isArray(res.data)) {
          allNews.push(...res.data);
        }
      }
      const sorted = allNews
        .sort((a, b) => new Date(b.datetime * 1000) - new Date(a.datetime * 1000))
        .slice(0, 20)
        .map(item => ({
          headline: item.headline,
          source: item.source,
          url: item.url,
          time: new Date(item.datetime * 1000).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
      setNews(sorted);
    } catch (e) {
      console.error("Failed to fetch news:", e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="px-5 sm:px-8 py-3 flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-border border-t-foreground rounded-full animate-spin" />
        <span className="font-mono text-[9px] lowercase tracking-[0.22em] text-muted-foreground/40">loading feed...</span>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div
      className="py-3 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-0">
        <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/40 px-4 flex-shrink-0 border-r border-border mr-4">
          market intel
        </span>
        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-12 whitespace-nowrap"
            style={{
              animation: paused ? "none" : "marquee 60s linear infinite",
            }}
          >
            {[...news, ...news].map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 flex-shrink-0 group"
              >
                <span className="font-mono text-[9px] text-muted-foreground/40">{item.time}</span>
                <span className="font-mono text-[10px] lowercase text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.headline.toLowerCase()}
                </span>
                {item.source && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/30 border border-border/30 px-1.5 py-0.5 group-hover:border-border/60 transition-colors">
                    {item.source}
                  </span>
                )}
                {item.url && (
                  <span className="font-mono text-[9px] text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors">↗</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}