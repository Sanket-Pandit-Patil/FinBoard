'use client';

import React from 'react';
import { useWidgetData } from '@/hooks/useWidgetData';
import { WidgetConfig, CardType } from '@/types/widget';

import { useRealtimeData } from '@/hooks/useRealtimeData';

export default function MarketCard({ widget }: { widget: WidgetConfig }) {
    const { data, loading, error } = useWidgetData(widget.apiConfig, widget.settings?.refreshInterval);

    // Check for Real-time Socket capability
    const useSocket = !!(widget.apiConfig?.provider === 'finnhub' && widget.apiConfig.params.symbol);
    const { data: realtimeData, status: socketStatus } = useRealtimeData(
        widget.apiConfig,
        useSocket // Enable if it's finnhub
    );

    const cardType: CardType = widget.settings?.cardType || (widget.settings?.viewMode === 'list' ? 'watchlist' : 'single');

    // Mock data for different card types
    const watchlistData = [
        { symbol: 'AAPL', price: 154.2, change: '+1.2%', changeValue: 1.2 },
        { symbol: 'MSFT', price: 302.1, change: '+0.8%', changeValue: 0.8 },
        { symbol: 'GOOG', price: 2800.0, change: '-0.5%', changeValue: -0.5 },
        { symbol: 'AMZN', price: 3350.0, change: '+0.2%', changeValue: 0.2 },
    ];

    const marketGainersData = [
        { symbol: 'NVDA', price: 420.0, change: '+5.2%', changeValue: 5.2 },
        { symbol: 'TSLA', price: 900.5, change: '+3.8%', changeValue: 3.8 },
        { symbol: 'AMD', price: 125.0, change: '+2.5%', changeValue: 2.5 },
        { symbol: 'META', price: 380.0, change: '+2.1%', changeValue: 2.1 },
    ];

    const performanceData = [
        { label: '1D Return', value: '+2.5%', color: 'text-green-500' },
        { label: '1W Return', value: '+5.8%', color: 'text-green-500' },
        { label: '1M Return', value: '+12.3%', color: 'text-green-500' },
        { label: 'YTD Return', value: '+28.5%', color: 'text-green-500' },
    ];

    const financialData = [
        { label: 'Market Cap', value: '$2.5T' },
        { label: 'P/E Ratio', value: '28.5' },
        { label: 'Dividend Yield', value: '0.5%' },
        { label: '52W High', value: '$180.00' },
        { label: '52W Low', value: '$120.00' },
    ];

    // Watchlist view
    if (cardType === 'watchlist') {
        return (
            <div className="flex flex-col h-full overflow-hidden p-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Watchlist</div>
                <div className="flex-1 overflow-auto">
                    {watchlistData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b dark:border-zinc-800 last:border-0">
                            <span className="font-semibold text-sm dark:text-gray-200">{item.symbol}</span>
                            <div className="text-right">
                                <div className="text-sm font-medium dark:text-gray-100">${item.price}</div>
                                <div className={`text-xs ${item.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{item.change}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Market Gainers view
    if (cardType === 'market-gainers') {
        return (
            <div className="flex flex-col h-full overflow-hidden p-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Gainers</div>
                <div className="flex-1 overflow-auto">
                    {marketGainersData
                        .sort((a, b) => b.changeValue - a.changeValue)
                        .map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b dark:border-zinc-800 last:border-0">
                                <span className="font-semibold text-sm dark:text-gray-200">{item.symbol}</span>
                                <div className="text-right">
                                    <div className="text-sm font-medium dark:text-gray-100">${item.price}</div>
                                    <div className="text-xs text-green-500">{item.change}</div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        );
    }

    // Performance Data view
    if (cardType === 'performance') {
        return (
            <div className="flex flex-col h-full overflow-hidden p-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Performance</div>
                <div className="flex-1 overflow-auto space-y-2">
                    {performanceData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                            <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Financial Data view
    if (cardType === 'financial') {
        return (
            <div className="flex flex-col h-full overflow-hidden p-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Financial Data</div>
                <div className="flex-1 overflow-auto space-y-2">
                    {financialData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 border-b dark:border-zinc-800 last:border-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                            <span className="text-sm font-medium dark:text-gray-200">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default mapping if not configured (Single Value Mode)
    let displayValue: string | number | undefined = widget.dataMap?.value
        ? (data && typeof data === 'object' ? get(data, widget.dataMap.value) : JSON.stringify(data))
        : (data ? JSON.stringify(data).slice(0, 50) : '');

    // OVERRIDE with Socket Data if available
    // Finnhub 'quote' endpoint returns 'c' for current price. 
    // If we have a live socket price, use it.
    if (realtimeData && widget.dataMap?.value === 'c') {
        displayValue = realtimeData.c;
    }

    // Apply formatting
    let rawValue = Number(displayValue);
    if (!isNaN(rawValue)) {
        if (widget.format === 'currency') displayValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rawValue);
        else if (widget.format === 'percent') displayValue = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(rawValue / 100);
        else if (widget.format === 'number') displayValue = new Intl.NumberFormat('en-US').format(rawValue);
    }

    const symbol = widget.apiConfig?.params.symbol || '---';
    const label = widget.description || 'Current Value';
    const lastUpdated = new Date().toLocaleTimeString();

    return (
        <div className="flex flex-col h-full relative group">
            {/* Header / Badge */}
            <div className="flex justify-between items-start mb-2 gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {useSocket && (
                        <div className="flex items-center gap-1.5 flex-shrink-0" title={socketStatus.connected ? 'Real-time connected' : socketStatus.error || 'Connecting...'}>
                            <span className="relative flex h-2 w-2">
                                {socketStatus.connected ? (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </>
                                ) : (
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                )}
                            </span>
                            {socketStatus.lastUpdate && (
                                <span className="text-[9px] text-slate-500 hidden sm:inline">
                                    {new Date(socketStatus.lastUpdate).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    )}
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</span>
                </div>
                {symbol !== '---' && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700 flex-shrink-0">
                        {symbol}
                    </span>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center min-h-0">
                {loading && !data && <div className="animate-pulse h-10 w-32 bg-slate-800 rounded"></div>}
                {error && <div className="text-red-400 text-xs truncate">{error}</div>}

                {data && (
                    <div className="text-3xl sm:text-4xl font-bold text-white tracking-tighter break-words overflow-wrap-anywhere" title={String(displayValue)}>
                        {displayValue || '--'}
                    </div>
                )}
                {!loading && !data && !error && (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-sm text-center px-2">
                        <div className="mb-2">⚙️</div>
                        <div className="text-xs">No data configured</div>
                        <div className="text-[10px] mt-1 text-slate-600">Click settings to configure API</div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/50 gap-2">
                <span className="truncate">Last updated: {lastUpdated}</span>
                {widget.format === 'currency' && <span className="uppercase text-slate-600 flex-shrink-0">USD</span>}
            </div>
        </div>
    );
}

// Helper to get nested value by path string (e.g. "a.b.c")
function get(obj: any, path: string) {
    if (!path) return undefined;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current === null || current === undefined) return undefined;
        current = current[key];
    }
    return current;
}
