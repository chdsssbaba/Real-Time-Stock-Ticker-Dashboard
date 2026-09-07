export const CircuitState = {
  CLOSED: 'CLOSED',       // Normal operation, requests pass through
  OPEN: 'OPEN',           // Failing, requests are blocked immediately
  HALF_OPEN: 'HALF_OPEN'  // Testing recovery, single request allowed
} as const;

export type CircuitState = (typeof CircuitState)[keyof typeof CircuitState];

export type StateChangeCallback = (state: CircuitState) => void;

/**
 * Wraps an asynchronous function with circuit breaker logic.
 *
 * @param fn The async fetch function to protect.
 * @param failureThreshold Number of failures before tripping to OPEN.
 * @param resetTimeoutMs Time in ms to wait before moving from OPEN to HALF_OPEN.
 * @param onStateChange Callback to notify UI or listeners of state changes.
 */
export function createCircuitBreaker<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  failureThreshold: number = 3,
  resetTimeoutMs: number = 30000,
  onStateChange?: StateChangeCallback
) {
  let state: CircuitState = CircuitState.CLOSED;
  let failureCount = 0;
  let lastFailureTime = 0;

  const setState = (newState: CircuitState) => {
    if (state !== newState) {
      state = newState;
      if (onStateChange) {
        onStateChange(state);
      }
    }
  };

  const breaker = async (...args: TArgs): Promise<TResult> => {
    const now = Date.now();

    // 1. Check if OPEN state needs transition to HALF_OPEN
    if (state === CircuitState.OPEN) {
      if (now - lastFailureTime >= resetTimeoutMs) {
        setState(CircuitState.HALF_OPEN);
      } else {
        throw new Error('Circuit Breaker is OPEN');
      }
    }

    // 2. Execute wrapped function
    try {
      const result = await fn(...args);
      
      // On success: reset counters and set state back to CLOSED
      failureCount = 0;
      if (state === CircuitState.HALF_OPEN || state === CircuitState.OPEN) {
        setState(CircuitState.CLOSED);
      }
      return result;
    } catch (error) {
      failureCount += 1;
      lastFailureTime = Date.now();

      // Trip to OPEN if threshold reached or if failure happened in HALF_OPEN state
      if (failureCount >= failureThreshold || state === CircuitState.HALF_OPEN) {
        setState(CircuitState.OPEN);
      }

      throw error;
    }
  };

  breaker.getState = () => state;
  breaker.reset = () => {
    failureCount = 0;
    lastFailureTime = 0;
    setState(CircuitState.CLOSED);
  };
  breaker.trip = () => {
    failureCount = failureThreshold;
    lastFailureTime = Date.now();
    setState(CircuitState.OPEN);
  };

  return breaker;
}
