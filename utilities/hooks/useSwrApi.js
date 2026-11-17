import { useState, useEffect, useCallback, useRef } from "react";
import {
  swrPostApiData,
  subscribeApiCache,
  getCacheKey,
} from "@/utilities/services/apiService";

/**
 * Custom zero-dependency React hook implementing Stale-While-Revalidate (SWR).
 *
 * Provides:
 * - Instant in-memory cache return (0 ms UI delay)
 * - Automatic background revalidation
 * - Cross-component synchronization via shared cache subscribers
 * - Tab focus and visibility auto-revalidation
 * - Direct mutation and optimistic update support
 *
 * @param {string} action - API endpoint action name from apiList
 * @param {object} payload - Request payload object
 * @param {object} options - SWR configuration { ttl: 60000, enabled: true, initialData: null }
 */
export function useSwrApi(action, payload = {}, options = {}) {
  const {
    ttl = 60000,
    enabled = true,
    initialData = null,
  } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isValidating, setIsValidating] = useState(false);

  const payloadString = JSON.stringify(payload || {});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (force = false) => {
      if (!action || !enabled) return;

      setIsValidating(true);
      try {
        const parsedPayload = JSON.parse(payloadString);
        const res = await swrPostApiData(action, parsedPayload, {
          ttl,
          force,
          onRevalidate: (freshData) => {
            if (isMounted.current) {
              setData(freshData?.data ?? freshData);
              setIsValidating(false);
            }
          },
        });

        if (isMounted.current) {
          if (res?.status) {
            setData(res?.data ?? res);
            setError(null);
          } else {
            setError(res?.message || "Failed to fetch data");
          }
          setIsLoading(false);
          setIsValidating(false);
        }
        return res;
      } catch (err) {
        if (isMounted.current) {
          setError(err?.message || "Network error");
          setIsLoading(false);
          setIsValidating(false);
        }
      }
    },
    [action, payloadString, enabled, ttl]
  );

  // Initial fetch and subscribe to cache updates
  useEffect(() => {
    if (!action || !enabled) return;

    fetchData(false);

    const cacheKey = getCacheKey(action, JSON.parse(payloadString));
    const unsubscribe = subscribeApiCache(cacheKey, (freshRes) => {
      if (isMounted.current && freshRes?.status) {
        setData(freshRes?.data ?? freshRes);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [action, payloadString, enabled, fetchData]);

  const mutate = useCallback(
    async (newDataOrPromise, shouldRevalidate = true) => {
      if (typeof newDataOrPromise === "function") {
        setData((prev) => newDataOrPromise(prev));
      } else if (newDataOrPromise !== undefined) {
        setData(newDataOrPromise);
      }

      if (shouldRevalidate) {
        return await fetchData(true);
      }
    },
    [fetchData]
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    revalidate: () => fetchData(true),
  };
}

export default useSwrApi;
