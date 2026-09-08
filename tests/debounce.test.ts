import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../src/utils/debounce';

describe('Debounce Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution until after specified delay', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('AAPL');
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time by 499ms
    vi.advanceTimersByTime(499);
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward remaining 1ms
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('AAPL');
  });

  it('should reset timer on consecutive calls within delay period', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('A');
    vi.advanceTimersByTime(200);

    debounced('AA');
    vi.advanceTimersByTime(200);

    debounced('AAP');
    vi.advanceTimersByTime(200);

    debounced('AAPL');
    expect(callback).not.toHaveBeenCalled();

    // Advance by full 500ms since last call
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('AAPL');
  });

  it('should allow manual cancellation of pending execution', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('TSLA');
    vi.advanceTimersByTime(300);

    debounced.cancel();
    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();
  });
});
