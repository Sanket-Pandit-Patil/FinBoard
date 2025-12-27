/**
 * API Key Validation and Security Utilities
 */

export interface ApiKeyStatus {
    isValid: boolean;
    isDemo: boolean;
    provider: string;
    message?: string;
}

/**
 * Validates API key format (basic checks)
 * Note: Full validation requires making an actual API call
 */
export function validateApiKeyFormat(key: string, provider: string): boolean {
    if (!key || key === 'demo' || key.length < 10) {
        return false;
    }

    switch (provider) {
        case 'alpha-vantage':
            // Alpha Vantage keys are typically alphanumeric, 16+ characters
            return /^[A-Z0-9]{16,}$/i.test(key);
        case 'finnhub':
            // Finnhub keys are typically alphanumeric, 20+ characters
            return /^[A-Z0-9]{20,}$/i.test(key);
        default:
            return key.length >= 10;
    }
}

/**
 * Checks if API key is demo/placeholder
 */
export function isDemoKey(key: string): boolean {
    return !key || key === 'demo' || key === 'your_key_here' || key.includes('demo');
}

/**
 * Gets API key status for a provider
 */
export function getApiKeyStatus(provider: string): ApiKeyStatus {
    const key = getApiKey(provider);
    const isDemo = isDemoKey(key);
    const isValid = validateApiKeyFormat(key, provider);

    return {
        isValid: !isDemo && isValid,
        isDemo,
        provider,
        message: isDemo 
            ? 'Using demo key. Configure API key in .env.local for live data.'
            : !isValid 
                ? 'API key format appears invalid. Please check your configuration.'
                : undefined,
    };
}

/**
 * Gets API key for provider (from environment)
 */
function getApiKey(provider: string): string {
    switch (provider) {
        case 'alpha-vantage':
            return process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';
        case 'finnhub':
            return process.env.NEXT_PUBLIC_FINNHUB_KEY || 'demo';
        default:
            return 'demo';
    }
}

/**
 * Sanitizes API key for display (shows only first/last few chars)
 */
export function sanitizeApiKeyForDisplay(key: string): string {
    if (!key || key === 'demo') return 'demo';
    if (key.length <= 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

