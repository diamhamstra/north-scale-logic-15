import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinancialNewsMarquee() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const response = await base44.functions.invoke('getFinancialNews', {});
      const newsData = response.data?.data || response.data || [];
      setNews(Array.isArray(newsData) ? newsData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching financial news:', error);
      setNews([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="border-t border-border bg-background overflow-hidden py-3">
        <div className="flex gap-8 animate-marquee-reverse">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border bg-background overflow-hidden py-3">
      <div className="flex gap-8 animate-marquee-reverse">
        {[...news, ...news].map((item, idx) => (
          <a
            key={`${item.datetime}-${idx}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-3 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="uppercase tracking-wider text-[10px] text-foreground">
              [{item.category}]
            </span>
            <span className="truncate max-w-md">
              {item.headline}
            </span>
            <span className="text-[10px] text-muted-foreground">
              — {item.source}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}