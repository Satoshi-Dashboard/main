import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 9119;

app.use(cors());
app.use(express.json());

// Mock BTC price data
function generateHistoryData(days, interval) {
  const data = [];
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const startTime = now - days * msPerDay;

  let intervalMs = msPerDay; // 1d default
  if (interval === '1h') intervalMs = 60 * 60 * 1000;
  else if (interval === '15m') intervalMs = 15 * 60 * 1000;
  else if (interval === '5m') intervalMs = 5 * 60 * 1000;

  let basePrice = 72000;
  for (let ts = startTime; ts < now; ts += intervalMs) {
    const variation = Math.sin(ts / (msPerDay * 7)) * 5000 + (Math.random() - 0.5) * 2000;
    const price = basePrice + variation;
    data.push({
      ts: ts,
      price: Math.max(price, 40000),
    });
  }

  return data;
}

// Endpoint: BTC spot price
app.get('/api/btc/rates', (req, res) => {
  const price = 72000 + (Math.random() - 0.5) * 2000;
  res.json({
    btc_usd: price.toFixed(2),
    btc_change_24h_pct: (Math.random() - 0.5) * 10,
    source_btc: 'binance',
  });
});

// Endpoint: BTC historical data
app.get('/api/public/binance/btc-history', (req, res) => {
  const days = parseInt(req.query.days || '1', 10);
  const interval = req.query.interval || '1d';
  const data = generateHistoryData(days, interval);
  res.json({ data });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`   GET /api/btc/rates`);
  console.log(`   GET /api/public/binance/btc-history?days=1&interval=5m`);
});
