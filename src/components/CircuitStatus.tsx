import { useState, useEffect } from 'react';
import { CircuitState } from '../utils/circuitBreaker';
import { subscribeCircuitState, stockCircuitBreaker } from '../api/stockService';
import { AlertTriangle, CheckCircle, ShieldAlert, RefreshCw } from 'lucide-react';

export default function CircuitStatus() {
  const [state, setState] = useState<CircuitState>(stockCircuitBreaker.getState());

  useEffect(() => {
    const unsubscribe = subscribeCircuitState((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const handleManualTrip = () => {
    stockCircuitBreaker.trip();
  };

  const handleManualReset = () => {
    stockCircuitBreaker.reset();
  };

  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let Icon = CheckCircle;
  let statusText = 'API Healthy (CLOSED)';
  let descText = 'All stock requests passing through normally. Circuit breaker monitoring activity.';

  if (state === CircuitState.OPEN) {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    Icon = ShieldAlert;
    statusText = 'API Circuit OPEN - Failing Fast';
    descText = 'Multiple failures detected. Blocking requests for 30s to prevent API hammering.';
  } else if (state === CircuitState.HALF_OPEN) {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    Icon = AlertTriangle;
    statusText = 'API Recovery (HALF-OPEN)';
    descText = 'Testing API health with single trial request...';
  }

  return (
    <div 
      className="circuit-banner rounded-xl border backdrop-blur-md p-4 mb-6 transition-all duration-300 shadow-lg"
      role="region"
      aria-label="Circuit Breaker Status"
    >
      {/* Accessible ARIA Live region for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Circuit breaker status changed to: {statusText}. {descText}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${badgeColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resilience Layer</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeColor}`}>
                {state}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 mt-0.5">{statusText}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{descText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {state === CircuitState.OPEN ? (
            <button
              onClick={handleManualReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Reset Circuit Breaker to Closed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Circuit
            </button>
          ) : (
            <button
              onClick={handleManualTrip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
              title="Simulate API outages to test Circuit Breaker trip"
              aria-label="Simulate Circuit Breaker trip"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Simulate Outage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
