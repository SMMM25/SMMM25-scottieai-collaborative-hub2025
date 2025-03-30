import { useCallback, useEffect, useState } from 'react';

type DebounceOptions = {
  delay?: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
};

const defaultOptions: DebounceOptions = {
  delay: 300,
  maxWait: 1000,
  leading: false,
  trailing: true,
};

/**
 * Custom hook for debouncing values
 * @param value The value to debounce
 * @param options Debounce options
 */
export function useDebounce<T>(value: T, options: DebounceOptions = {}) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    // If leading is true, update immediately on first change
    if (mergedOptions.leading && value !== debouncedValue) {
      setDebouncedValue(value);
    }

    // Set up the debounce timeout
    const timer = setTimeout(() => {
      if (mergedOptions.trailing) {
        setDebouncedValue(value);
      }
    }, mergedOptions.delay);

    // Set up max wait timeout if specified
    let maxWaitTimer: NodeJS.Timeout | undefined;
    if (mergedOptions.maxWait && mergedOptions.maxWait > (mergedOptions.delay || 0)) {
      maxWaitTimer = setTimeout(() => {
        setDebouncedValue(value);
      }, mergedOptions.maxWait);
    }

    // Clean up timeouts
    return () => {
      clearTimeout(timer);
      if (maxWaitTimer) {
        clearTimeout(maxWaitTimer);
      }
    };
  }, [value, mergedOptions.delay, mergedOptions.maxWait, mergedOptions.leading, mergedOptions.trailing]);

  return debouncedValue;
}

/**
 * Custom hook for debouncing functions
 * @param fn The function to debounce
 * @param options Debounce options
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  options: DebounceOptions = {}
) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Use useRef to store the timeout ID
  const timeoutRef = useState<NodeJS.Timeout | null>(null)[1];
  const maxWaitTimeoutRef = useState<NodeJS.Timeout | null>(null)[1];
  const lastInvokeTimeRef = useState<number>(0)[1];
  
  // Store the latest function in a ref to avoid recreating the debounced function
  const fnRef = useState<T>(fn)[1];
  useEffect(() => {
    fnRef(fn);
  }, [fn]);
  
  const debouncedFn = useCallback((...args: Parameters<T>) => {
    const currentTime = Date.now();
    const elapsed = currentTime - lastInvokeTimeRef();
    const invoke = () => {
      lastInvokeTimeRef(Date.now());
      fnRef(...args);
    };
    
    // Clear existing timeouts
    if (timeoutRef()) {
      clearTimeout(timeoutRef());
      timeoutRef(null);
    }
    
    // Handle leading edge invocation
    if (mergedOptions.leading && elapsed > (mergedOptions.delay || 0)) {
      invoke();
    }
    
    // Set up new timeout for trailing edge
    if (mergedOptions.trailing) {
      timeoutRef(setTimeout(() => {
        timeoutRef(null);
        if (!mergedOptions.leading || elapsed > (mergedOptions.delay || 0)) {
          invoke();
        }
      }, mergedOptions.delay));
    }
    
    // Set up max wait timeout if needed
    if (mergedOptions.maxWait && !maxWaitTimeoutRef() && elapsed > mergedOptions.maxWait) {
      maxWaitTimeoutRef(setTimeout(() => {
        maxWaitTimeoutRef(null);
        invoke();
      }, Math.max(mergedOptions.maxWait - elapsed, 0)));
    }
  }, [mergedOptions.delay, mergedOptions.maxWait, mergedOptions.leading, mergedOptions.trailing]);
  
  return debouncedFn;
}
