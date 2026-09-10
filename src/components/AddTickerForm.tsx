import React, { useState, useMemo, useEffect } from 'react';
import { debounce } from '../utils/debounce';
import { PlusCircle, Search } from 'lucide-react';

interface AddTickerFormProps {
  onAddTicker: (symbol: string) => void;
  existingTickers: string[];
}

export default function AddTickerForm({ onAddTicker, existingTickers }: AddTickerFormProps) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create 500ms debounced update function
  const debouncedSetState = useMemo(
    () =>
      debounce((val: string) => {
        setDebouncedValue(val.trim().toUpperCase());
      }, 500),
    []
  );

  // Handle controlled input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setErrorMsg('');
    debouncedSetState(val);
  };

  // Cleanup debouncer on unmount
  useEffect(() => {
    return () => {
      debouncedSetState.cancel();
    };
  }, [debouncedSetState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const symbolToAdd = debouncedValue || inputValue.trim().toUpperCase();

    if (!symbolToAdd) {
      setErrorMsg('Please enter a stock ticker symbol (e.g. NVDA)');
      return;
    }

    if (existingTickers.includes(symbolToAdd)) {
      setErrorMsg(`${symbolToAdd} is already tracked on your dashboard`);
      return;
    }

    onAddTicker(symbolToAdd);
    setInputValue('');
    setDebouncedValue('');
    setErrorMsg('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mb-8">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="ticker-input"
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="Enter symbol (e.g., NVDA, META, AMD)..."
            aria-label="Stock Ticker Symbol"
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? "ticker-error-desc" : undefined}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono uppercase tracking-wider"
          />
          {debouncedValue && debouncedValue !== inputValue.trim().toUpperCase() && (
            <span className="absolute right-3 top-3 text-xs text-cyan-400 font-mono italic animate-pulse">
              Debouncing...
            </span>
          )}
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Ticker</span>
        </button>
      </div>

      {errorMsg && (
        <p id="ticker-error-desc" className="text-xs text-rose-400 mt-2 font-medium">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
