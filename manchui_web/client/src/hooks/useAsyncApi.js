import { useState, useCallback } from "react";

/**
 * async API 호출 시 loading / error 상태를 재사용하기 위한 훅
 * @returns {{ run: (fn: () => Promise<T>) => Promise<T>, loading: boolean, error: unknown, setError: (e: unknown) => void }}
 */
export function useAsyncApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error, setError };
}
