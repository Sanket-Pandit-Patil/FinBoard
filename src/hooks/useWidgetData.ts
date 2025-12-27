import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cacheData, selectCachedData } from '@/store/dataSlice';
import { adapters, AdapterId } from '@/adapters/apiAdapters';
import { ApiConfig } from '@/types/widget';
import { rateLimiter } from '@/utils/rateLimiter';
import { getApiKeyStatus } from '@/utils/apiKeyValidator';

/**
 * Custom hook to fetch and manage widget data.
 * 
 * Implements:
 * 1. Data Fetching via adapters (Alpha Vantage, Finnhub, etc.)
 * 2. Caching via Redux (dedupes requests)
 * 3. Polling for real-time updates (configurable interval)
 * 
 * @param apiConfig - The configuration for the API request (PROVIDER, ENDPOINT, PARAMS)
 * @param refreshInterval - Interval in milliseconds to auto-refresh data (0 = disabled)
 * @returns {Object} { data, loading, error }
 */
export function useWidgetData(apiConfig?: ApiConfig, refreshInterval: number = 0) {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create a unique key for caching based on config
    const cacheKey = apiConfig ? `${apiConfig.provider}:${apiConfig.endpoint}:${JSON.stringify(apiConfig.params)}` : '';
    const cachedData = useAppSelector((state) => apiConfig ? selectCachedData(state as any, cacheKey) : null);

    const [data, setData] = useState<any>(cachedData);

    useEffect(() => {
        if (!apiConfig) return;

        const fetchData = async () => {
            // Check cache validity for initial load
            const currentCache = selectCachedData((dispatch as any).store?.getState?.() || { data: { cache: {} } }, cacheKey);

            // If we have valid cached data and not simple forced refresh, use it.
            if (cachedData && !refreshInterval) {
                setData(cachedData);
                return;
            }

            // Check API key status
            const keyStatus = getApiKeyStatus(apiConfig.provider);
            if (keyStatus.isDemo) {
                setError('Demo API key detected. Configure API key for live data.');
                setLoading(false);
                return;
            }

            // Check rate limit before making request
            const rateLimitCheck = rateLimiter.canMakeRequest(apiConfig.provider);
            if (!rateLimitCheck.allowed) {
                setError(
                    rateLimitCheck.retryAfter 
                        ? `${rateLimitCheck.reason}. Retry after ${rateLimitCheck.retryAfter}s`
                        : rateLimitCheck.reason || 'Rate limit exceeded'
                );
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const adapter = adapters[apiConfig.provider];
                if (!adapter) throw new Error(`Unknown provider: ${apiConfig.provider}`);

                const result = await adapter.fetch(apiConfig.endpoint, apiConfig.params);
                dispatch(cacheData({ key: cacheKey, data: result }));
                setData(result);
            } catch (err: any) {
                // Enhanced error messages
                let errorMessage = err.message || 'Failed to fetch data';
                
                // Provide helpful context for common errors
                if (errorMessage.includes('Rate limit')) {
                    const remaining = rateLimiter.getRemainingRequests(apiConfig.provider);
                    errorMessage += `. Remaining: ${remaining.perMinute}/min`;
                } else if (errorMessage.includes('Invalid API Key')) {
                    errorMessage += '. Please check your API key configuration.';
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        if (refreshInterval > 0) {
            const intervalId = setInterval(fetchData, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [apiConfig, refreshInterval, dispatch, cacheKey]);

    return { data, loading, error };
}
