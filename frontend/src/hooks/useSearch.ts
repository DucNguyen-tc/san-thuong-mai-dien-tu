import { useState, useEffect, useRef } from 'react';
import { getSuggestions } from '@/services/searchService';
import type { SuggestResponse } from '@/services/searchService';

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
}

export function useSearch({ debounceMs = 200, limit = 5 }: UseSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SuggestResponse>({ keywords: [], products: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setData({ keywords: [], products: [] });
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      // Hủy request trước đó nếu người dùng vẫn đang gõ liên tục
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const res = await getSuggestions(trimmed, limit, abortControllerRef.current.signal);
        setData(res);
      } catch (err: any) {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          console.error('[useSearch Error]:', err);
          setError(err?.message || 'Lỗi lấy gợi ý tìm kiếm');
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs, limit]);

  return {
    query,
    setQuery,
    keywords: data.keywords,
    products: data.products,
    isLoading,
    error,
    clearQuery: () => setQuery(''),
  };
}
