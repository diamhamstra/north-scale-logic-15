import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("FINNHUB_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
    );

    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch news' }, { status: response.status });
    }

    const articles = await response.json();

    const formatted = (articles || []).slice(0, 30).map(item => ({
      headline: item.headline || 'Untitled',
      url: item.url || '#',
      source: item.source || 'Finnhub',
      category: item.category || 'general',
      datetime: item.datetime || Date.now() / 1000,
    }));

    return Response.json(formatted);
  } catch (error) {
    console.error('getFinancialNews error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});