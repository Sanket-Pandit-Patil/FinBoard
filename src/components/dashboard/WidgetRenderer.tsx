'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { WidgetConfig } from '@/types/widget';
const MarketCard = dynamic(() => import('@/components/widgets/MarketCard'), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-zinc-800 h-full w-full rounded" />
});
const StockTable = dynamic(() => import('@/components/widgets/StockTable'), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-zinc-800 h-full w-full rounded" />
});
const ChartWidget = dynamic(() => import('@/components/widgets/ChartWidget'), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-zinc-800 h-full w-full rounded" />
});

export default function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
    switch (widget.type) {
        case 'card':
            return <MarketCard widget={widget} />;
        case 'table':
            return <StockTable widget={widget} />;
        case 'chart':
            return <ChartWidget widget={widget} />;
        default:
            return <div className="p-4 text-center text-gray-400">Unknown widget type: {widget.type}</div>;
    }
}
