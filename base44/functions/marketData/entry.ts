import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("FINNHUB_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const body = await req.json();

    // News endpoint
    if (body.endpoint === 'news') {
      const category = body.params?.category || 'general';
      const response = await fetch(
        `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`
      );
      if (!response.ok) {
        return Response.json({ error: 'Failed to fetch news' }, { status: response.status });
      }
      const articles = await response.json();
      const formatted = (articles || []).slice(0, 50).map(item => ({
        headline: item.headline || 'Untitled',
        url: item.url || '#',
        source: item.source || 'Finnhub',
        category: item.category || 'general',
        datetime: item.datetime || Date.now() / 1000,
      }));
      return Response.json(formatted);
    }

    // Quote endpoint
    const symbolsParam = body.symbols || '';
    const symbolList = symbolsParam.split(',').filter(s => s.trim());

    if (symbolList.length === 0) {
      return Response.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const results = {};
    await Promise.all(symbolList.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
        );
        if (response.ok) {
          const data = await response.json();
          results[symbol] = data;
        }
      } catch (e) {
        console.error(`Failed to fetch ${symbol}:`, e);
      }
    }));

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});