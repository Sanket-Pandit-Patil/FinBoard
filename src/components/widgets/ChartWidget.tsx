'use client';

import React from 'react';
import { useWidgetData } from '@/hooks/useWidgetData';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { WidgetConfig, ChartType, ChartInterval } from '@/types/widget';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import CandlestickChart from './CandlestickChart';

// Candlestick data structure
interface CandlestickData {
    name: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

export default function ChartWidget({ widget }: { widget: WidgetConfig }) {
    const { data: apiData, loading, error } = useWidgetData(widget.apiConfig, widget.settings?.refreshInterval);
    const [interval, setChartInterval] = React.useState<ChartInterval>(widget.settings?.chartInterval || 'daily');
    const [chartType, setChartType] = React.useState<ChartType>(widget.settings?.chartType || 'line');

    // Real-time data support
    const useSocket = !!(widget.apiConfig?.provider === 'finnhub' && widget.apiConfig.params.symbol);
    const { data: realtimeData, status: socketStatus } = useRealtimeData(
        widget.apiConfig,
        useSocket
    );

    // Sync with widget settings changes
    React.useEffect(() => {
        if (widget.settings?.chartInterval) {
            setChartInterval(widget.settings.chartInterval);
        }
        if (widget.settings?.chartType) {
            setChartType(widget.settings.chartType);
        }
    }, [widget.settings]);

    // Mock data based on interval
    const lineDataMap: Record<ChartInterval, any[]> = {
        'daily': [
            { name: '9am', v: 100 },
            { name: '10am', v: 102 },
            { name: '11am', v: 105 },
            { name: '12pm', v: 103 },
            { name: '1pm', v: 108 },
            { name: '2pm', v: 106 },
            { name: '3pm', v: 110 },
            { name: '4pm', v: 108 }
        ],
        'weekly': [
            { name: 'Mon', v: 100 },
            { name: 'Tue', v: 105 },
            { name: 'Wed', v: 102 },
            { name: 'Thu', v: 108 },
            { name: 'Fri', v: 110 }
        ],
        'monthly': [
            { name: 'Week 1', v: 100 },
            { name: 'Week 2', v: 115 },
            { name: 'Week 3', v: 108 },
            { name: 'Week 4', v: 120 }
        ],
    };

    // Mock candlestick data
    const candleDataMap: Record<ChartInterval, CandlestickData[]> = {
        'daily': [
            { name: '9am', open: 100, high: 102, low: 99, close: 101 },
            { name: '10am', open: 101, high: 105, low: 100, close: 104 },
            { name: '11am', open: 104, high: 106, low: 103, close: 105 },
            { name: '12pm', open: 105, high: 107, low: 103, close: 103 },
            { name: '1pm', open: 103, high: 109, low: 102, close: 108 },
            { name: '2pm', open: 108, high: 110, low: 106, close: 106 },
            { name: '3pm', open: 106, high: 112, low: 105, close: 110 },
            { name: '4pm', open: 110, high: 111, low: 107, close: 108 }
        ],
        'weekly': [
            { name: 'Mon', open: 100, high: 105, low: 98, close: 103 },
            { name: 'Tue', open: 103, high: 108, low: 102, close: 105 },
            { name: 'Wed', open: 105, high: 106, low: 100, close: 102 },
            { name: 'Thu', open: 102, high: 110, low: 101, close: 108 },
            { name: 'Fri', open: 108, high: 112, low: 107, close: 110 }
        ],
        'monthly': [
            { name: 'Week 1', open: 100, high: 115, low: 95, close: 110 },
            { name: 'Week 2', open: 110, high: 120, low: 108, close: 115 },
            { name: 'Week 3', open: 115, high: 118, low: 105, close: 108 },
            { name: 'Week 4', open: 108, high: 125, low: 107, close: 120 }
        ],
    };

    // Live Simulation for "Hardcoded" feel
    const [simulatedData, setSimulatedData] = React.useState<any[]>([]);

    React.useEffect(() => {
        // Initialize with basic mock data based on interval
        const baseData = lineDataMap[interval] || lineDataMap['daily'];
        setSimulatedData(baseData);

        // Simulation Loop
        const simInterval = setInterval(() => {
            setSimulatedData(prev => {
                // Clone the last point and modify it slightly for a "live" feel
                const newData = [...prev];
                const lastItem = newData[newData.length - 1];

                // Random walk logic
                const change = (Math.random() - 0.5) * 5; // -2.5 to +2.5
                const newValue = Math.max(50, (lastItem.v || 100) + change);

                // Shift: Remove first, add new "Next Hour/Day"
                const shiftedData = newData.slice(1);

                // Generate next label logic (simplified)
                const nextLabel = "Live";

                return [...shiftedData, { ...lastItem, name: nextLabel, v: Number(newValue.toFixed(2)) }];
            });
        }, 3000); // Update every 3 seconds

        return () => clearInterval(simInterval);
    }, [interval]);

    // Use API data if valid, otherwise use Simulated Data
    const lineData = (Array.isArray(apiData) && apiData.length > 0) ? apiData : simulatedData;
    const candleData = candleDataMap[interval] || candleDataMap['daily'];


    return (
        <div className="w-full h-full flex flex-col relative">
            {loading && (
                <div className="absolute inset-0 z-10 bg-white/80 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="text-xs text-blue-600 font-medium">Loading Chart...</div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 z-10 bg-white/90 dark:bg-zinc-900 flex flex-col items-center justify-center p-4">
                    <div className="text-red-500 text-sm font-semibold mb-1">⚠️ Error</div>
                    <div className="text-red-400 text-xs text-center">{error}</div>
                    <div className="text-gray-500 text-xs mt-2">Check API configuration</div>
                </div>
            )}

            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded p-0.5">
                        {(['daily', 'weekly', 'monthly'] as ChartInterval[]).map(i => (
                            <button
                                key={i}
                                onClick={() => setChartInterval(i)}
                                className={`text-[10px] px-2 py-0.5 rounded capitalize ${interval === i ? 'bg-white dark:bg-zinc-600 shadow-sm font-medium' : 'text-gray-500'}`}
                            >
                                {i}
                            </button>
                        ))}
                    </div>
                    {useSocket && (
                        <div className="flex items-center gap-1" title={socketStatus.connected ? 'Real-time connected' : 'Connecting...'}>
                            <span className="relative flex h-1.5 w-1.5">
                                {socketStatus.connected ? (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </>
                                ) : (
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
                                )}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setChartType('line')}
                        className={`text-[10px] px-1 ${chartType === 'line' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
                    >
                        Line
                    </button>
                    <button
                        onClick={() => setChartType('candle')}
                        className={`text-[10px] px-1 ${chartType === 'candle' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
                    >
                        Candle
                    </button>
                    <button
                        onClick={() => setChartType('bar')}
                        className={`text-[10px] px-1 ${chartType === 'bar' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
                    >
                        Bar
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {chartType === 'candle' ? (
                    <div className="relative w-full h-full">
                        <CandlestickChart data={candleData} />
                        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                            <div className="flex justify-around text-[10px] text-gray-500 dark:text-gray-400 px-2 pb-1">
                                {candleData.map((d, i) => (
                                    <span key={i}>{d.name}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'line' ? (
                            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        ) : (
                            <BarChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="v" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
