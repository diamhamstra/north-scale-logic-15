import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = [
  "Getting Started",
  "Complete Your Profile",
  "Identity Verification",
  "Research Engines",
  "Performance",
  "Documents",
  "Security",
  "Frequently Asked Questions",
];

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SupportArticle.filter({ is_published: true });
      setArticles(data);
    } catch (e) {
      console.error("Failed to load articles:", e);
    }
    setLoading(false);
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedArticles = CATEGORIES.reduce((acc, cat) => {
    const catArticles = filteredArticles.filter(a => a.category === cat);
    if (catArticles.length > 0) acc[cat] = catArticles;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Articles by Category */}
      {Object.keys(groupedArticles).length === 0 ? (
        <div className="border border-border p-12 text-center">
          <p className="font-mono text-xs text-muted-foreground">No articles found.</p>
        </div>
      ) : (
        Object.entries(groupedArticles).map(([category, catArticles]) => (
          <div key={category} className="mb-8">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-4 pb-2 border-b border-border">
              {category}
            </h3>
            <div className="space-y-2">
              {catArticles.map(article => (
                <div
                  key={article.id}
                  onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                  className="border border-border cursor-pointer hover:bg-secondary/10 transition-colors"
                >
                  <div className="flex items-center justify-between p-4">
                    <p className="font-mono text-xs text-foreground flex-1">{article.title}</p>
                    {expandedArticle === article.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  {expandedArticle === article.id && (
                    <div className="border-t border-border p-4 font-mono text-xs leading-6 text-muted-foreground whitespace-pre-wrap">
                      {article.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}