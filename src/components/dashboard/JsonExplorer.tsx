'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

interface JsonExplorerProps {
    data: any;
    onSelectPath: (path: string, value?: any) => void;
    selectedPath?: string;
}

const JsonNode = ({
    data,
    path,
    name,
    onSelectPath,
    selectedPath,
    level
}: {
    data: any;
    path: string;
    name: string;
    onSelectPath: (p: string, v: any) => void;
    selectedPath?: string;
    level: number
}) => {
    const [expanded, setExpanded] = useState(level < 2); // Auto expand top levels
    const isObject = data !== null && typeof data === 'object';
    const isArray = Array.isArray(data);
    const isSelected = path === selectedPath;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isObject) {
            onSelectPath(path, data);
        }
    };

    return (
        <div className="ml-4 font-mono text-sm">
            <div
                className={clsx(
                    "flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 rounded px-1 py-0.5 transition-colors",
                    isSelected && "bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700"
                )}
                onClick={isObject ? handleToggle : handleSelect}
            >
                {isObject && (
                    <span className="mr-1 text-gray-500">
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                <span className="text-purple-600 dark:text-purple-400 mr-1">{name}:</span>
                {!isObject ? (
                    <span className="text-green-600 dark:text-green-400 truncate max-w-[200px] inline-block align-bottom">{JSON.stringify(data)}</span>
                ) : (
                    <span className="text-gray-400 text-xs">{isArray ? `Array[${data.length}]` : `{...}`}</span>
                )}
                {isSelected && <CheckCircle size={14} className="ml-2 text-blue-600" />}
            </div>

            {isObject && expanded && (
                <div className="border-l border-gray-200 dark:border-zinc-700 ml-1">
                    {Object.entries(data).map(([key, value]) => (
                        <JsonNode
                            key={key}
                            name={key}
                            data={value}
                            path={path ? `${path}.${key}` : key}
                            onSelectPath={onSelectPath}
                            selectedPath={selectedPath}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function JsonExplorer({ data, onSelectPath, selectedPath }: JsonExplorerProps) {
    if (!data) return <div className="text-gray-400 italic p-4">No data to explore. Fetch API first.</div>;

    return (
        <div className="border rounded-md p-4 bg-white dark:bg-zinc-950 overflow-auto max-h-[400px]">
            <JsonNode
                data={data}
                name="root"
                path=""
                onSelectPath={onSelectPath}
                selectedPath={selectedPath}
                level={0}
            />
        </div>
    );
}
