# FinBoard API Setup Guide

This application connects to real financial data providers. To get live data, you need to configure your API keys.

## 1. Get Free API Keys

*   **Alpha Vantage**: [159GUW172W4XW06H]
      (https://www.alphavantage.co/support/#api-key)
    * *Limit: 5 requests per minute (Free Tier)*

*   **Finnhub**: [d57p6a1r01qrcrnd0ce0d57p6a1r01qrcrnd0ceg]
      (https://finnhub.io/register)
    * *Limit: 60 requests per minute (Free Tier)*

## 2. Configure Local Environment

1.  Create a file named `.env.local` in the root directory (`finboard/`).
2.  Add your keys to the file:

```env
NEXT_PUBLIC_ALPHA_VANTAGE_KEY=your_key_here
NEXT_PUBLIC_FINNHUB_KEY=your_key_here
```

3.  Restart your development server (`npm run dev`) for changes to take effect.

## 3. Rate Limiting

The application handles rate limits automatically:
*   If you hit a limit (e.g., Alpha Vantage's 5 calls/min), the widget will display a specific error message.
*   The "refresh interval" in widget settings can be adjusted to respect these limits.
