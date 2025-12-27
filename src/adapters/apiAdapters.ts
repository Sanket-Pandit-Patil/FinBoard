import { rateLimiter } from '@/utils/rateLimiter';
import { getApiKeyStatus, isDemoKey } from '@/utils/apiKeyValidator';

export interface ApiAdapter {
    id: string;
    name: string;
    endpoints: {
        label: string;
        value: string;
        params: string[]; // required params e.g. ['symbol']
    }[];
    fetch: (endpoint: string, params: Record<string, string>) => Promise<any>;
}

const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY || 'demo';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    baseDelay: number = RETRY_DELAY
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            
            // Don't retry on rate limit or auth errors
            if (error.message?.includes('Rate limit') || 
                error.message?.includes('Invalid API Key') ||
                error.message?.includes('401')) {
                throw error;
            }
            
            // Exponential backoff
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError!;
}

export const alphaVantageAdapter: ApiAdapter = {
    id: 'alpha-vantage',
    name: 'Alpha Vantage',
    endpoints: [
        { label: 'Time Series Daily', value: 'TIME_SERIES_DAILY', params: ['symbol'] },
        { label: 'Global Quote', value: 'GLOBAL_QUOTE', params: ['symbol'] },
    ],
    fetch: async (endpoint, params) => {
        // Check API key status
        const keyStatus = getApiKeyStatus('alpha-vantage');
        if (keyStatus.isDemo) {
            console.warn('Alpha Vantage: Using demo key. Configure API key for live data.');
        }

        // Check rate limit before making request
        const rateLimitCheck = rateLimiter.canMakeRequest('alpha-vantage');
        if (!rateLimitCheck.allowed) {
            throw new Error(
                rateLimitCheck.retryAfter 
                    ? `${rateLimitCheck.reason}. Retry after ${rateLimitCheck.retryAfter}s`
                    : rateLimitCheck.reason || 'Rate limit exceeded'
            );
        }

        return retryWithBackoff(async () => {
            const query = new URLSearchParams({
                function: endpoint,
                apikey: ALPHA_VANTAGE_KEY,
                ...params,
            });
            
            const res = await fetch(`https://www.alphavantage.co/query?${query}`);
            
            // Record request attempt
            rateLimiter.recordRequest('alpha-vantage');
            
            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error('Rate limit exceeded. Try again later.');
                }
                throw new Error(`API Error: ${res.statusText}`);
            }
            
            const data = await res.json();

            // Alpha Vantage Soft Errors (these come as 200 OK with error in body)
            if (data.Note && data.Note.includes('call frequency')) {
                throw new Error('API Rate Limit Reached (5 calls/min). Please wait before retrying.');
            }
            if (data['Error Message']) {
                throw new Error(`Invalid API Params or Key: ${data['Error Message']}`);
            }
            if (data.Information) {
                throw new Error(data.Information);
            }

            return data;
        });
    },
};

export const finnhubAdapter: ApiAdapter = {
    id: 'finnhub',
    name: 'Finnhub',
    endpoints: [
        { label: 'Quote', value: 'quote', params: ['symbol'] },
        { label: 'Company Profile', value: 'stock/profile2', params: ['symbol'] },
    ],
    fetch: async (endpoint, params) => {
        // Check API key status
        const keyStatus = getApiKeyStatus('finnhub');
        if (keyStatus.isDemo) {
            console.warn('Finnhub: Using demo key. Configure API key for live data.');
        }

        // Check rate limit before making request
        const rateLimitCheck = rateLimiter.canMakeRequest('finnhub');
        if (!rateLimitCheck.allowed) {
            throw new Error(
                rateLimitCheck.retryAfter 
                    ? `${rateLimitCheck.reason}. Retry after ${rateLimitCheck.retryAfter}s`
                    : rateLimitCheck.reason || 'Rate limit exceeded'
            );
        }

        return retryWithBackoff(async () => {
            const query = new URLSearchParams({
                token: FINNHUB_KEY,
                ...params,
            });
            
            const res = await fetch(`https://finnhub.io/api/v1/${endpoint}?${query}`);
            
            // Record request attempt
            rateLimiter.recordRequest('finnhub');
            
            if (!res.ok) {
                if (res.status === 429) {
                    const retryAfter = res.headers.get('Retry-After');
                    throw new Error(
                        retryAfter 
                            ? `Rate limit exceeded. Retry after ${retryAfter} seconds.`
                            : 'Rate limit exceeded. Try again later.'
                    );
                }
                if (res.status === 401) {
                    throw new Error('Invalid API Key. Please check your Finnhub API key.');
                }
                if (res.status === 403) {
                    throw new Error('API access forbidden. Check your API key permissions.');
                }
                throw new Error(`API Error: ${res.statusText} (${res.status})`);
            }
            
            const data = await res.json();
            
            // Check for Finnhub error responses
            if (data.error) {
                throw new Error(`Finnhub API Error: ${data.error}`);
            }
            
            return data;
        });
    },
};

export const indianApiAdapter: ApiAdapter = {
    id: 'indian-api',
    name: 'Indian Stock API (Mock)',
    endpoints: [
        { label: 'Stock Price', value: 'stock_price', params: ['symbol'] }
    ],
    fetch: async (endpoint, params) => {
        // Mocking Indian API as I don't have a reliable free public one for this demo without key
        // In real world, would fetch from actual URL
        return new Promise(resolve => setTimeout(() => resolve({
            symbol: params.symbol,
            price: (Math.random() * 2000 + 100).toFixed(2),
            change: (Math.random() * 10 - 5).toFixed(2) + '%',
            volume: Math.floor(Math.random() * 1000000),
            marketCap: '1.5T'
        }), 800));
    }
}

export const adapters = {
    'alpha-vantage': alphaVantageAdapter,
    'finnhub': finnhubAdapter,
    'indian-api': indianApiAdapter,
};

export type AdapterId = keyof typeof adapters;
