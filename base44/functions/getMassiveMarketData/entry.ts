import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("MASSIVE_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY'];
    const results = [];

    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `https://api.massive.com/v1/stocks/${symbol}/quote`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            symbol: data.symbol || symbol,
            name: data.name || symbol,
            price: data.price || data.last || 0,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            volume: data.volume || 0,
            timestamp: data.timestamp || Date.now() / 1000,
          });
        }
      } catch (err) {
        // Skip individual symbol errors
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});