import { useQuery } from '@tanstack/react-query';
import { fetchStockData } from '../api/stockService';
import StockChart from './StockChart';
import { X, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';

interface StockCardProps {
  symbol: string;
  onRemove: (symbol: string) => void;
}

export default function StockCard({ symbol, onRemove }: StockCardProps) {
  const { data, isLoading, isError, error, isRefetching } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockData(symbol),
    refetchInterval: 10000, // Refresh automatically every 10 seconds
    retry: false,
  });

  if (isLoading) {
    return (
      <div 
        className="card-skeleton bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-72 animate-pulse"
        aria-label={`Loading stock data for ${symbol}`}
      >
        <div className="flex justify-between items-center">
          <div className="h-6 w-20 bg-slate-800 rounded-md"></div>
          <div className="h-6 w-6 bg-slate-800 rounded-full"></div>
        </div>
        <div className="space-y-3 my-4">
          <div className="h-8 w-32 bg-slate-800 rounded-md"></div>
          <div className="h-4 w-24 bg-slate-800 rounded-md"></div>
        </div>
        <div className="h-28 w-full bg-slate-800/60 rounded-xl"></div>
      </div>
    );
  }

  if (isError) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch data';
    return (
      <div 
        className="card-error bg-rose-950/20 border border-rose-800/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[280px]"
        aria-label={`Error loading stock data for ${symbol}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-wider font-mono">{symbol}</h2>
          </div>
          <button
            onClick={() => onRemove(symbol)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label={`Remove ${symbol}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-auto py-4">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Fetch Failed</p>
          <p className="text-sm text-slate-300 mt-1 font-mono break-words">{errorMsg}</p>
        </div>

        <div className="text-xs text-slate-500 pt-3 border-t border-rose-900/40 flex justify-between items-center">
          <span>Polling paused</span>
          <span className="font-mono text-rose-400">N/A</span>
        </div>
      </div>
    );
  }

  // Fallback guard for missing data fields
  const priceFormatted = data?.price != null ? `$${data.price.toFixed(2)}` : 'N/A';
  const changeVal = data?.change != null ? data.change : 0;
  const changePercentVal = data?.changePercent != null ? data.changePercent : 0;
  const isPositive = changeVal >= 0;

  const changeFormatted = `${isPositive ? '+' : ''}${changeVal.toFixed(2)}`;
  const percentFormatted = `${isPositive ? '+' : ''}${changePercentVal.toFixed(2)}%`;

  return (
    <div 
      className="stock-card bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between relative group"
      aria-label={`Stock data for ${symbol}`}
    >
      <header className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-100 tracking-wider font-mono">{symbol}</h2>
            {isRefetching && (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" aria-label="Refreshing stock price..." />
            )}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Live Ticker</span>
        </div>

        <button
          onClick={() => onRemove(symbol)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
          aria-label={`Remove ${symbol}`}
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="my-3">
        <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
          {priceFormatted}
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <span 
            className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-2.5 py-1 rounded-md border ${
              isPositive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {changeFormatted} ({percentFormatted})
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Today</span>
        </div>
      </div>

      {data?.historical && (
        <StockChart data={data.historical} isPositive={isPositive} />
      )}

      <footer className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div>H: <span className="text-slate-300">${data?.high?.toFixed(2) ?? 'N/A'}</span></div>
        <div>L: <span className="text-slate-300">${data?.low?.toFixed(2) ?? 'N/A'}</span></div>
        <div>Prev: <span className="text-slate-300">${data?.previousClose?.toFixed(2) ?? 'N/A'}</span></div>
      </footer>
    </div>
  );
}
