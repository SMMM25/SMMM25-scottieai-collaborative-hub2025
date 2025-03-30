import { useEffect, useState } from 'react';

type CacheOptions = {
  expireTime?: number; // in milliseconds
  staleWhileRevalidate?: boolean;
};

const defaultOptions: CacheOptions = {
  expireTime: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true,
};

// Cache storage
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Custom hook for data fetching with caching
 * @param key Unique cache key
 * @param fetchFn Function that returns a promise with data
 * @param options Cache options
 */
export function useDataFetcher<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if we have cached data
        const cachedData = cache.get(key);
        const now = Date.now();

        // If we have cached data and it's not expired
        if (cachedData && now - cachedData.timestamp < (mergedOptions.expireTime || 0)) {
          setData(cachedData.data);
          setIsLoading(false);
          return;
        }

        // If we have stale data, use it while fetching fresh data
        if (mergedOptions.staleWhileRevalidate && cachedData) {
          setData(cachedData.data);
        }

        // Fetch fresh data
        const freshData = await fetchFn();
        
        // Update cache
        cache.set(key, { data: freshData, timestamp: Date.now() });
        
        // Update state
        setData(freshData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, mergedOptions.expireTime, mergedOptions.staleWhileRevalidate]);

  // Function to manually refetch data
  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const freshData = await fetchFn();
      cache.set(key, { data: freshData, timestamp: Date.now() });
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      console.error('Error refetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear cache for this key
  const clearCache = () => {
    cache.delete(key);
  };

  return { data, isLoading, error, refetch, clearCache };
}

/**
 * Clear all cached data
 */
export function clearAllCache() {
  cache.clear();
}

/**
 * Clear cached data for a specific key
 */
export function clearCacheByKey(key: string) {
  cache.delete(key);
}

/**
 * Get all cache keys
 */
export function getCacheKeys(): string[] {
  return Array.from(cache.keys());
}

/**
 * Check if a key exists in cache
 */
export function hasCacheKey(key: string): boolean {
  return cache.has(key);
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return cache.size;
}
