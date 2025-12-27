/**
 * Rate Limiter for API Requests
 * Tracks requests per provider and enforces rate limits
 */

export interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerDay?: number;
    provider: string;
}

export interface RateLimitState {
    requests: number[];
    dailyRequests: number;
    lastReset: number;
    dailyReset: number;
}

class RateLimiter {
    private limits: Map<string, RateLimitConfig> = new Map();
    private states: Map<string, RateLimitState> = new Map();

    constructor() {
        // Initialize default limits for known providers
        this.setLimit('alpha-vantage', {
            provider: 'alpha-vantage',
            requestsPerMinute: 5,
            requestsPerDay: 500, // Free tier limit
        });

        this.setLimit('finnhub', {
            provider: 'finnhub',
            requestsPerMinute: 60,
            requestsPerDay: 10000, // Free tier limit
        });

        this.setLimit('indian-api', {
            provider: 'indian-api',
            requestsPerMinute: 100,
        });
    }

    setLimit(provider: string, config: RateLimitConfig) {
        this.limits.set(provider, config);
        if (!this.states.has(provider)) {
            this.states.set(provider, {
                requests: [],
                dailyRequests: 0,
                lastReset: Date.now(),
                dailyReset: this.getStartOfDay(),
            });
        }
    }

    private getStartOfDay(): number {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now.getTime();
    }

    private cleanupOldRequests(provider: string) {
        const state = this.states.get(provider);
        if (!state) return;

        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Remove requests older than 1 minute
        state.requests = state.requests.filter(timestamp => timestamp > oneMinuteAgo);

        // Reset daily counter if new day
        if (now >= state.dailyReset + 86400000) {
            state.dailyRequests = 0;
            state.dailyReset = this.getStartOfDay();
        }
    }

    canMakeRequest(provider: string): { allowed: boolean; reason?: string; retryAfter?: number } {
        const config = this.limits.get(provider);
        if (!config) {
            return { allowed: true }; // No limit configured
        }

        this.cleanupOldRequests(provider);
        const state = this.states.get(provider)!;

        // Check per-minute limit
        if (state.requests.length >= config.requestsPerMinute) {
            const oldestRequest = state.requests[0];
            const retryAfter = Math.ceil((oldestRequest + 60000 - Date.now()) / 1000);
            return {
                allowed: false,
                reason: `Rate limit: ${config.requestsPerMinute} requests per minute`,
                retryAfter: Math.max(0, retryAfter),
            };
        }

        // Check daily limit
        if (config.requestsPerDay && state.dailyRequests >= config.requestsPerDay) {
            return {
                allowed: false,
                reason: `Daily quota exceeded: ${config.requestsPerDay} requests per day`,
            };
        }

        return { allowed: true };
    }

    recordRequest(provider: string) {
        const state = this.states.get(provider);
        if (!state) {
            this.states.set(provider, {
                requests: [Date.now()],
                dailyRequests: 1,
                lastReset: Date.now(),
                dailyReset: this.getStartOfDay(),
            });
            return;
        }

        state.requests.push(Date.now());
        state.dailyRequests++;
    }

    getRemainingRequests(provider: string): { perMinute: number; perDay?: number } {
        const config = this.limits.get(provider);
        const state = this.states.get(provider);
        
        if (!config || !state) {
            return { perMinute: Infinity };
        }

        this.cleanupOldRequests(provider);

        return {
            perMinute: Math.max(0, config.requestsPerMinute - state.requests.length),
            perDay: config.requestsPerDay ? Math.max(0, config.requestsPerDay - state.dailyRequests) : undefined,
        };
    }

    reset(provider?: string) {
        if (provider) {
            this.states.delete(provider);
        } else {
            this.states.clear();
        }
    }
}

export const rateLimiter = new RateLimiter();

