'use client';

import React, { useState } from 'react';
import { useWidgetData } from '@/hooks/useWidgetData';
import { WidgetConfig } from '@/types/widget';
import { Search } from 'lucide-react';

export default function StockTable({ widget }: { widget: WidgetConfig }) {
    // Integrate real hook, but keep mock data for demo structure if API is empty
    const { data, loading, error } = useWidgetData(widget.apiConfig, widget.settings?.refreshInterval);

    // Mock data extension for pagination demo
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState('all'); // demo filter
    const itemsPerPage = 5;

    // Use API data if available (assuming it's a list), otherwise fallback to mock
    // This allows "Loading" state to be shown if hook is working.

    // For manual verification of loading state without real API:
    // const loading = true; 

    const allData = (Array.isArray(data) ? data : [
        { symbol: 'AAPL', price: 150.2, volume: '50M', type: 'Tech' },
        { symbol: 'GOOGL', price: 2800.5, volume: '2M', type: 'Tech' },
        { symbol: 'MSFT', price: 300.1, volume: '20M', type: 'Tech' },
        { symbol: 'AMZN', price: 3400.0, volume: '3M', type: 'Retail' },
        { symbol: 'TSLA', price: 900.5, volume: '15M', type: 'Auto' },
        { symbol: 'NVDA', price: 420.0, volume: '10M', type: 'Tech' },
        { symbol: 'JPM', price: 160.0, volume: '8M', type: 'Finance' },
        { symbol: 'V', price: 230.0, volume: '5M', type: 'Finance' },
        { symbol: 'WMT', price: 140.0, volume: '12M', type: 'Retail' },
        { symbol: 'DIS', price: 110.0, volume: '18M', type: 'Entertainment' },
    ]);

    const filtered = allData.filter((r: any) =>
        r.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterType === 'all' || r.type === filterType)
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    if (loading) {
        return (
            <div className="flex flex-col h-full space-y-2 p-1 animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-5/6"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-red-500 text-sm p-4 text-center">
                <div className="mb-2">⚠️</div>
                <div className="font-semibold">Error loading data</div>
                <div className="text-xs mt-1 text-red-400">{error}</div>
                <div className="text-xs mt-2 text-gray-500">Check API configuration</div>
            </div>
        );
    }

    if (!data && !allData.length) {
        return <div className="flex h-full items-center justify-center text-gray-400 text-sm">No Data</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="mb-2 flex gap-2">
                <div className="flex-1 flex items-center bg-gray-100 dark:bg-zinc-800 rounded px-2">
                    <Search size={14} className="text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-transparent border-none focus:ring-0 p-1.5 text-sm dark:text-white outline-none"
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <select
                    className="bg-gray-100 dark:bg-zinc-800 text-xs px-2 rounded dark:text-gray-300 border-none outline-none"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="Tech">Tech</option>
                    <option value="Finance">Finance</option>
                    <option value="Retail">Retail</option>
                </select>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-900 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th className="px-3 py-2">Symbol</th>
                            <th className="px-3 py-2">Price</th>
                            <th className="px-3 py-2">Vol</th>
                            <th className="px-3 py-2">Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(row => (
                            <tr key={row.symbol} className="bg-white border-b dark:bg-zinc-950 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                                <td className="px-3 py-2 font-medium dark:text-white">{row.symbol}</td>
                                <td className="px-3 py-2 dark:text-gray-300">${row.price}</td>
                                <td className="px-3 py-2 dark:text-gray-300">{row.volume}</td>
                                <td className="px-3 py-2 dark:text-gray-500 text-xs">{row.type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 border-t pt-2 dark:border-zinc-800">
                <span>Page {currentPage} of {totalPages || 1}</span>
                <div className="flex gap-1">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200 disabled:opacity-50"
                    >Prev</button>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200 disabled:opacity-50"
                    >Next</button>
                </div>
            </div>
        </div>
    );
}
