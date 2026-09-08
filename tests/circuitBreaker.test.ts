import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCircuitBreaker, CircuitState } from '../src/utils/circuitBreaker';

describe('Circuit Breaker State Machine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start in CLOSED state and pass successful calls through', async () => {
    const mockFn = vi.fn().mockResolvedValue({ price: 150 });
    const stateCallback = vi.fn();
    const breaker = createCircuitBreaker(mockFn, 3, 30000, stateCallback);

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
    const result = await breaker('AAPL');

    expect(result).toEqual({ price: 150 });
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should trip to OPEN state after hitting failure threshold', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('API Rate Limit Exceeded'));
    const stateCallback = vi.fn();
    const breaker = createCircuitBreaker(mockFn, 3, 30000, stateCallback);

    // 1st failure
    await expect(breaker('AAPL')).rejects.toThrow('API Rate Limit Exceeded');
    expect(breaker.getState()).toBe(CircuitState.CLOSED);

    // 2nd failure
    await expect(breaker('AAPL')).rejects.toThrow('API Rate Limit Exceeded');
    expect(breaker.getState()).toBe(CircuitState.CLOSED);

    // 3rd failure - trips to OPEN
    await expect(breaker('AAPL')).rejects.toThrow('API Rate Limit Exceeded');
    expect(breaker.getState()).toBe(CircuitState.OPEN);
    expect(stateCallback).toHaveBeenLastCalledWith(CircuitState.OPEN);

    // 4th call should FAIL FAST instantly without calling underlying mockFn
    await expect(breaker('AAPL')).rejects.toThrow('Circuit Breaker is OPEN');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should transition from OPEN to HALF_OPEN after timeout and handle recovery', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'));
    const stateCallback = vi.fn();
    const breaker = createCircuitBreaker(mockFn, 3, 30000, stateCallback);

    // Trip circuit to OPEN
    for (let i = 0; i < 3; i++) {
      await expect(breaker('GOOG')).rejects.toThrow();
    }
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // Advance time by 29,900ms (still OPEN)
    vi.advanceTimersByTime(29900);
    await expect(breaker('GOOG')).rejects.toThrow('Circuit Breaker is OPEN');

    // Advance remaining 200ms (total >= 30,000ms)
    vi.advanceTimersByTime(200);

    // Next invocation allows 1 trial call in HALF_OPEN state
    mockFn.mockResolvedValueOnce({ price: 140 });
    const trialResult = await breaker('GOOG');

    expect(trialResult).toEqual({ price: 140 });
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
    expect(stateCallback).toHaveBeenLastCalledWith(CircuitState.CLOSED);
  });

  it('should re-trip to OPEN if trial request fails during HALF_OPEN state', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network Failure'));
    const stateCallback = vi.fn();
    const breaker = createCircuitBreaker(mockFn, 3, 30000, stateCallback);

    // Trip circuit to OPEN
    for (let i = 0; i < 3; i++) {
      await expect(breaker('MSFT')).rejects.toThrow();
    }
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // Wait 30,000ms
    vi.advanceTimersByTime(30000);

    // Trial call fails -> immediately re-trips to OPEN
    await expect(breaker('MSFT')).rejects.toThrow('Network Failure');
    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });
});
