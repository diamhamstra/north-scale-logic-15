import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("FINNHUB_API_KEY");
    if (!apiKey) {
      console.error('FINNHUB_API_KEY not configured');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const body = await req.json();
    const instruments = body.instruments || [];

    if (instruments.length === 0) {
      return Response.json({ error: 'No instruments provided' }, { status: 400 });
    }

    const results = [];

    for (const inst of instruments) {
      let priceData = null;
      let usedSymbol = inst.finnhubSymbol;
      let attemptCount = 0;

      const symbolsToTry = inst.fallbackSymbol 
        ? [inst.finnhubSymbol, inst.fallbackSymbol]
        : [inst.finnhubSymbol];

      console.log(`Fetching ${inst.symbol} (${inst.name})`);

      for (const symbol of symbolsToTry) {
        attemptCount++;
        try {
          console.log(`${inst.symbol} - Attempt ${attemptCount}: ${symbol}`);
          
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
          );

          console.log(`${inst.symbol} - HTTP ${response.status} (${symbol})`);

          if (response.status === 401) {
            console.error(`${inst.symbol} - API key invalid (401)`);
            results.push({
              ...inst,
              price: null,
              change: null,
              changePercent: null,
              status: 'error',
              errorMessage: 'API key invalid',
            });
            break;
          }

          if (response.status === 429) {
            console.error(`${inst.symbol} - Rate limit reached (429)`);
            results.push({
              ...inst,
              price: null,
              change: null,
              changePercent: null,
              status: 'error',
              errorMessage: 'Rate limit reached',
            });
            break;
          }

          const data = await response.json();
          console.log(`${inst.symbol} - Raw response (${symbol}):`, JSON.stringify(data));

          const price = data.c;
          const change = data.d;
          const changePercent = data.dp;
          const lastUpdated = data.t;

          if (price === null || price === undefined || price === 0) {
            console.log(`${inst.symbol} - Price unavailable (${symbol}, c=${price})`);
            if (attemptCount === symbolsToTry.length) {
              results.push({
                ...inst,
                price: null,
                change: null,
                changePercent: null,
                status: 'unavailable',
              });
            }
            continue;
          }

          priceData = { price, change, changePercent, lastUpdated };
          usedSymbol = symbol;
          console.log(`${inst.symbol} - Success (${symbol}): price=${price}, change=${change}, changePercent=${changePercent}%`);
          break;
        } catch (error) {
          console.error(`${inst.symbol} - Fetch error (${symbol}):`, error.message);
          if (attemptCount === symbolsToTry.length) {
            results.push({
              ...inst,
              price: null,
              change: null,
              changePercent: null,
              status: 'error',
              errorMessage: error.message,
            });
          }
        }
      }

      if (priceData) {
        results.push({
          ...inst,
          price: parseFloat(priceData.price),
          change: parseFloat(priceData.change),
          changePercent: parseFloat(priceData.changePercent),
          lastUpdated: priceData.lastUpdated ? new Date(priceData.lastUpdated * 1000).toISOString() : null,
          usedSymbol,
          status: 'active',
        });
      }
    }

    return Response.json(results);
  } catch (error) {
    console.error('getMarketPulse error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});