import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const finnhubKey = Deno.env.get("FINNHUB_API_KEY");
    const massiveKey = Deno.env.get("MASSIVE_API_KEY");
    if (!finnhubKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const results = [];

    // Market symbols from Finnhub
    const symbols = [
      { symbol: 'SPY', name: 'S&P 500' },
      { symbol: 'QQQ', name: 'Nasdaq 100' },
      { symbol: 'IWM', name: 'Russell 2000' },
      { symbol: 'TLT', name: '20+ Year Treasury' },
      { symbol: 'GLD', name: 'Gold' },
      { symbol: 'USO', name: 'Crude Oil' },
      { symbol: 'VIX', name: 'Volatility Index' },
    ];

    for (const { symbol, name } of symbols) {
      try {
        const quoteResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`
        );

        if (quoteResponse.ok) {
          const quote = await quoteResponse.json();
          
          let cagr = 0;
          try {
            const now = Math.floor(Date.now() / 1000);
            const yearAgo = now - 31536000;
            const historicalResponse = await fetch(
              `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${yearAgo}&to=${now}&token=${finnhubKey}`
            );
            if (historicalResponse.ok) {
              const historical = await historicalResponse.json();
              if (historical && historical.c && historical.c.length >= 2) {
                const oldestPrice = historical.c[historical.c.length - 1];
                const newestPrice = historical.c[0];
                cagr = ((newestPrice / oldestPrice) - 1) * 100;
              }
            }
          } catch (e) {
            // Ignore historical errors
          }

          results.push({
            symbol: symbol,
            name: name,
            price: quote.c || 0,
            change: quote.d || 0,
            changePercent: quote.dp || 0,
            cagr: cagr.toFixed(2),
            type: 'market',
          });
        }
      } catch (err) {
        // Skip individual symbol errors
      }
    }

    // Interest rates from Massive API
    if (massiveKey) {
      try {
        const treasuryResponse = await fetch(
          `https://api.massive.com/v1/economy/treasury-yields`,
          {
            headers: {
              'Authorization': `Bearer ${massiveKey}`,
              'Accept': 'application/json'
            }
          }
        );

        if (treasuryResponse.ok) {
          const treasuryData = await treasuryResponse.json();
          
          // Add 10-year Treasury yield
          if (treasuryData && treasuryData.length > 0) {
            const latest = treasuryData[0];
            results.push({
              symbol: 'US10Y',
              name: '10-Year Treasury',
              price: latest.value || 0,
              change: 0,
              changePercent: 0,
              type: 'rate',
            });
          }
        }
      } catch (e) {
        // Ignore treasury errors
      }
    }

    // Fed Funds Rate from Massive API
    if (massiveKey) {
      try {
        const economyResponse = await fetch(
          `https://api.massive.com/v1/economy/overview`,
          {
            headers: {
              'Authorization': `Bearer ${massiveKey}`,
              'Accept': 'application/json'
            }
          }
        );

        if (economyResponse.ok) {
          const economyData = await economyResponse.json();
          
          if (economyData && economyData.fedFundsRate) {
            results.push({
              symbol: 'FED',
              name: 'Fed Funds Rate',
              price: economyData.fedFundsRate,
              change: 0,
              changePercent: 0,
              type: 'rate',
            });
          }
        }
      } catch (e) {
        // Ignore economy errors
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});