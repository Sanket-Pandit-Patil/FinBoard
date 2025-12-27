'use client';

import React from 'react';

interface CandlestickData {
    name: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface CandlestickChartProps {
    data: CandlestickData[];
}

export default function CandlestickChart({ data }: CandlestickChartProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

    React.useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    if (dimensions.width === 0 || dimensions.height === 0) {
        return <div ref={containerRef} className="w-full h-full" />;
    }

    const { width, height } = dimensions;
    const min = Math.min(...data.map(d => d.low));
    const max = Math.max(...data.map(d => d.high));
    const range = max - min || 1; // Avoid division by zero

    const scaleY = (value: number) => {
        return height - 20 - ((value - min) / range) * (height - 40); // Leave padding
    };

    const barWidth = (width / data.length) * 0.6;
    const barSpacing = width / data.length;
    const padding = 20;

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <svg width={width} height={height} className="absolute inset-0">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padding + (height - 2 * padding) * (1 - ratio);
                    return (
                        <line
                            key={ratio}
                            x1={0}
                            y1={y}
                            x2={width}
                            y2={y}
                            stroke="currentColor"
                            strokeWidth={0.5}
                            opacity={0.1}
                            className="text-gray-400"
                        />
                    );
                })}
                
                {/* Candlesticks */}
                {data.map((d, index) => {
                    const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
                    const isUp = d.close >= d.open;
                    const color = isUp ? '#10b981' : '#ef4444';
                    const strokeColor = isUp ? '#059669' : '#dc2626';
                    
                    const highY = scaleY(d.high);
                    const lowY = scaleY(d.low);
                    const openY = scaleY(d.open);
                    const closeY = scaleY(d.close);
                    const bodyTop = Math.min(openY, closeY);
                    const bodyBottom = Math.max(openY, closeY);
                    const bodyHeight = Math.max(bodyBottom - bodyTop, 2);

                    return (
                        <g key={index}>
                            {/* Wick */}
                            <line
                                x1={x + barWidth / 2}
                                y1={highY}
                                x2={x + barWidth / 2}
                                y2={lowY}
                                stroke={color}
                                strokeWidth={1.5}
                            />
                            {/* Body */}
                            <rect
                                x={x}
                                y={bodyTop}
                                width={barWidth}
                                height={bodyHeight}
                                fill={color}
                                stroke={strokeColor}
                                strokeWidth={1}
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

