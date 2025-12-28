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

    const allData = (Array.isArray(data) && data.length > 0 ? data : [
        { company: 'Uti Silver Etf', price: 114.2, '52_week_high': 114.73 },
        { company: 'Mirae Asset Mutual Fund Silver Etf', price: 114.92, '52_week_high': 114.70 },
        { company: 'Sbi Fix Sr54 1842 D Reg Idcw Cf', price: 16.03, '52_week_high': 16.22 },
        { company: 'Hdfc Gold Etf', price: 87.00, '52_week_high': 88.21 },
        { company: 'Absl Fmurrn', price: 110.16, '52_week_high': 110.16 },
        { company: 'Motilal Oswal Midcap 100 Etf', price: 60.32, '52_week_high': 22.00 },
    ]);

    const filtered = allData.filter((r: any) =>
        Object.values(r).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
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
        <div className="flex flex-col h-full bg-transparent">
            <div className="mb-3">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search table..."
                        className="w-full bg-gray-100 dark:bg-zinc-900/50 border border-transparent focus:border-emerald-500/50 rounded-lg pl-9 pr-3 py-2 text-xs dark:text-gray-200 outline-none transition-all placeholder-gray-500"
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-gray-100 dark:border-zinc-800/50">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-zinc-900/50 sticky top-0 backdrop-blur-sm">
                        <tr>
                            {paginated.length > 0 ? Object.keys(paginated[0]).map((key) => (
                                <th key={key} className="px-4 py-3 font-medium tracking-wider">{key.replace(/_/g, ' ')}</th>
                            )) : <th className="px-4 py-3">No Data</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                        {paginated.map((row, i) => (
                            <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors bg-transparent">
                                {Object.values(row).map((val: any, idx) => (
                                    <td key={idx} className="px-4 py-3 dark:text-gray-300 font-medium whitespace-nowrap">
                                        {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Showing {paginated.length} of {filtered.length} items
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >Prev</button>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >Next</button>
                </div>
            </div>
        </div>
    );
}
