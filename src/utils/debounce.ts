/**
 * Creates a debounced function that delays invoking the provided function
 * until after 'delay' milliseconds have elapsed since the last invocation.
 *
 * @param func The function to debounce.
 * @param delay The number of milliseconds to delay.
 * @returns A new debounced function with a cancel method.
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
