/**
 * Enhanced Real-time Data Hook
 * Supports WebSocket connections for live data updates across widgets
 */

import { useEffect, useRef, useState } from 'react';
import { ApiConfig } from '@/types/widget';

export interface RealtimeStatus {
    connected: boolean;
    error: string | null;
    lastUpdate: Date | null;
}

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;

/**
 * Generic real-time data hook that supports multiple providers
 */
export function useRealtimeData(
    apiConfig?: ApiConfig,
    enabled: boolean = false
): { data: any; status: RealtimeStatus } {
    const [data, setData] = useState<any>(null);
    const [status, setStatus] = useState<RealtimeStatus>({
        connected: false,
        error: null,
        lastUpdate: null,
    });
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000; // 3 seconds

    useEffect(() => {
        // Cleanup function
        const cleanup = () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (socketRef.current) {
                try {
                    if (socketRef.current.readyState === WebSocket.OPEN) {
                        socketRef.current.close(1000, 'Cleaning up');
                    } else {
                        socketRef.current.close();
                    }
                } catch (e) {
                    // Ignore cleanup errors
                } finally {
                    socketRef.current = null;
                }
            }
            reconnectAttempts.current = 0;
        };

        if (!enabled || !apiConfig) {
            cleanup();
            setStatus({
                connected: false,
                error: null,
                lastUpdate: null,
            });
            return cleanup;
        }

        // Only support Finnhub WebSocket for now
        if (apiConfig.provider !== 'finnhub' || !apiConfig.params.symbol) {
            cleanup();
            setStatus({
                connected: false,
                error: 'Real-time data only available for Finnhub quotes',
                lastUpdate: null,
            });
            return cleanup;
        }

        if (!FINNHUB_KEY || FINNHUB_KEY === 'demo') {
            cleanup();
            setStatus({
                connected: false,
                error: 'API key required for real-time data',
                lastUpdate: null,
            });
            return cleanup;
        }

        const connect = () => {
            try {
                // Clear any existing reconnection timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }

                const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);
                socketRef.current = ws;

                ws.onopen = () => {
                    // Only log in development mode
                    if (process.env.NODE_ENV === 'development') {
                        console.log('WebSocket connected for', apiConfig.params.symbol);
                    }
                    reconnectAttempts.current = 0;
                    setStatus(prev => ({
                        ...prev,
                        connected: true,
                        error: null,
                    }));

                    // Subscribe to symbol
                    try {
                        ws.send(JSON.stringify({
                            type: 'subscribe',
                            symbol: apiConfig.params.symbol,
                        }));
                    } catch (e) {
                        // Handle send errors silently
                        console.debug('WebSocket send error', e);
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        
                        if (message.type === 'trade' && message.data && message.data.length > 0) {
                            const lastTrade = message.data[message.data.length - 1];
                            setData({
                                c: lastTrade.p, // current price
                                h: lastTrade.p, // high (using current for demo)
                                l: lastTrade.p, // low
                                o: lastTrade.p, // open
                                pc: lastTrade.p, // previous close
                                t: lastTrade.t, // timestamp
                            });
                            setStatus(prev => ({
                                ...prev,
                                lastUpdate: new Date(),
                            }));
                        } else if (message.type === 'ping') {
                            // Respond to ping to keep connection alive
                            ws.send(JSON.stringify({ type: 'pong' }));
                        }
                    } catch (e) {
                        // Silently handle parse errors - they're usually non-critical
                        // (e.g., unexpected message format from server)
                        console.debug('WebSocket message parse error', e);
                    }
                };

                ws.onerror = (error) => {
                    // Suppress error logging - WebSocket errors are often expected
                    // (e.g., connection refused, network issues, invalid API key)
                    // The error state is already handled via onclose event
                    // Only update status silently without logging
                    setStatus(prev => ({
                        ...prev,
                        connected: false,
                        error: prev.error || 'WebSocket connection error',
                    }));
                };

                ws.onclose = (event) => {
                    setStatus(prev => ({
                        ...prev,
                        connected: false,
                    }));

                    // Don't attempt reconnection if it was a normal close or if we don't have required config
                    if (!apiConfig?.params.symbol || !FINNHUB_KEY || FINNHUB_KEY === 'demo') {
                        return;
                    }

                    // Only attempt reconnection if it wasn't a normal closure
                    // Code 1000 = normal closure, 1001 = going away, 1006 = abnormal closure
                    if (event.code !== 1000 && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                        reconnectAttempts.current++;
                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (process.env.NODE_ENV === 'development') {
                                console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`);
                            }
                            connect();
                        }, RECONNECT_DELAY * reconnectAttempts.current);
                    } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
                        setStatus(prev => ({
                            ...prev,
                            error: 'Max reconnection attempts reached',
                        }));
                    }
                };
            } catch (error) {
                setStatus({
                    connected: false,
                    error: 'Failed to establish WebSocket connection',
                    lastUpdate: null,
                });
            }
        };

        connect();

        return cleanup;
    }, [enabled, apiConfig?.provider, apiConfig?.params.symbol]);

    return { data, status };
}

