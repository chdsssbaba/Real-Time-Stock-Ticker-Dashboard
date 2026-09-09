import { createCircuitBreaker, CircuitState } from '../utils/circuitBreaker';

export interface PricePoint {
  time: string;
  price: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  historical: PricePoint[];
}

const API_KEY = import.meta.env.VITE_STOCK_API_KEY || 'demo';
const BASE_URL = import.meta.env.VITE_STOCK_API_BASE_URL || 'https://finnhub.io/api/v1';

// Base mock stock prices generator to ensure reliable, impressive visual data
const INITIAL_PRICES: Record<string, number> = {
  AAPL: 185.50,
  GOOG: 142.30,
  MSFT: 415.20,
  AMZN: 178.75,
  TSLA: 245.10,
  NVDA: 875.30,
  META: 485.60,
  NFLX: 620.40
};

// Listeners for global Circuit Breaker updates
const listeners = new Set<(state: CircuitState) => void>();

export function subscribeCircuitState(listener: (state: CircuitState) => void) {
  listeners.add(listener);
  listener(stockCircuitBreaker.getState());
  return () => {
    listeners.delete(listener);
  };
}

function notifyCircuitListeners(state: CircuitState) {
  listeners.forEach(listener => listener(state));
}

// Generate smooth past historical price data
function generateHistorical(basePrice: number): PricePoint[] {
  const points: PricePoint[] = [];
  const now = new Date();
  let currentPrice = basePrice * 0.96;

  for (let i = 9; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const volatility = (Math.random() - 0.48) * (basePrice * 0.015);
    currentPrice = Math.max(1, +(currentPrice + volatility).toFixed(2));
    points.push({ time: timeStr, price: currentPrice });
  }

  // Ensure last point matches latest base price
  points[points.length - 1].price = basePrice;
  return points;
}

// Base fetch raw implementation
async function fetchStockDataRaw(symbol: string): Promise<StockQuote> {
  const upperSymbol = symbol.toUpperCase().trim();

  // If using real API key and URL (not demo/default)
  if (API_KEY !== 'demo' && BASE_URL && !BASE_URL.includes('your-chosen-api')) {
    try {
      const response = await fetch(`${BASE_URL}/quote?symbol=${upperSymbol}&token=${API_KEY}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Parse Finnhub standard response (c: current, d: change, dp: percent change)
      if (data && typeof data.c === 'number' && data.c > 0) {
        const price = data.c;
        const change = data.d ?? 0;
        const changePercent = data.dp ?? 0;
        return {
          symbol: upperSymbol,
          price,
          change,
          changePercent,
          high: data.h ?? price,
          low: data.l ?? price,
          open: data.o ?? price,
          previousClose: data.pc ?? price,
          historical: generateHistorical(price)
        };
      }
    } catch (err) {
      // Re-throw to allow circuit breaker tracking
      throw err;
    }
  }

  // Dynamic fallback mock data (simulates real stock movement)
  const basePrice = INITIAL_PRICES[upperSymbol] || (100 + (upperSymbol.charCodeAt(0) * 5) % 200);
  const randomShift = (Math.random() - 0.49) * 2.5;
  const currentPrice = +(basePrice + randomShift).toFixed(2);
  const previousClose = +(basePrice - 0.85).toFixed(2);
  const change = +(currentPrice - previousClose).toFixed(2);
  const changePercent = +((change / previousClose) * 100).toFixed(2);

  // Artificial slight delay for realistic network feel
  await new Promise(res => setTimeout(res, 250));

  return {
    symbol: upperSymbol,
    price: currentPrice,
    change,
    changePercent,
    high: +(currentPrice + Math.abs(change) + 1.2).toFixed(2),
    low: +(currentPrice - Math.abs(change) - 0.9).toFixed(2),
    open: previousClose,
    previousClose,
    historical: generateHistorical(currentPrice)
  };
}

// Singleton Circuit Breaker instance
export const stockCircuitBreaker = createCircuitBreaker(
  fetchStockDataRaw,
  3,     // Trip after 3 consecutive failures
  30000, // 30s timeout before half-open retry
  (state) => notifyCircuitListeners(state)
);

export function fetchStockData(symbol: string): Promise<StockQuote> {
  return stockCircuitBreaker(symbol);
}
