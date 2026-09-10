import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import type { PricePoint } from '../api/stockService';

interface StockChartProps {
  data: PricePoint[];
  isPositive: boolean;
}

export default function StockChart({ data, isPositive }: StockChartProps) {
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';

  if (!data || data.length === 0) {
    return <div className="h-36 flex items-center justify-center text-xs text-slate-500">No chart data</div>;
  }

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1 || 1;

  return (
    <div className="w-full h-36 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${isPositive ? 'pos' : 'neg'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            hide 
          />
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]} 
            hide 
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const point = payload[0].payload as PricePoint;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl text-xs font-mono">
                    <p className="text-slate-400">{point.time}</p>
                    <p className="text-cyan-400 font-bold">${point.price.toFixed(2)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${isPositive ? 'pos' : 'neg'})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
