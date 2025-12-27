'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateLayout, addWidget, loadDashboard, setTheme } from '@/store/dashboardSlice';
import WidgetShell from './WidgetShell';
import WidgetRenderer from './WidgetRenderer';
import WidgetConfigModal from './WidgetConfigModal';
import { downloadJson, readJsonFile } from '@/utils/fileHelpers';
import { Upload, Download, Moon, Sun, Layout } from 'lucide-react';

import { templates, templateInfos } from '@/constants/templates';

const ResponsiveGridLayout = dynamic(() => import('./GridLayoutWrapper'), {
    ssr: false,
    loading: () => <div className="p-10 text-center">Loading Grid...</div>
});



export default function DashboardGrid() {
    const dispatch = useAppDispatch();
    const { layouts, widgets, theme } = useAppSelector((state) => state.dashboard);
    const [mounted, setMounted] = React.useState(false);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [editingWidgetId, setEditingWidgetId] = React.useState<string | null>(null);
    const [showTemplates, setShowTemplates] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isInitialLoadRef = useRef(true);
    const hasHandledInitialLayoutRef = useRef(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const saved = localStorage.getItem('finboard_dashboard');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure all required breakpoints exist
                const normalizedLayouts = {
                    lg: (parsed.layouts?.lg || []).filter((item: any) => parsed.widgets?.[item.i]),
                    md: (parsed.layouts?.md || []).filter((item: any) => parsed.widgets?.[item.i]),
                    sm: (parsed.layouts?.sm || []).filter((item: any) => parsed.widgets?.[item.i]),
                };
                
                // Ensure all widgets have corresponding layout items
                const widgetIds = Object.keys(parsed.widgets || {});
                const existingLayoutIds = new Set(normalizedLayouts.lg.map((item: any) => item.i));
                
                // Add missing layout items for widgets that don't have layouts
                widgetIds.forEach((id, index) => {
                    if (!existingLayoutIds.has(id)) {
                        // Calculate position to avoid overlap
                        const cols = 12;
                        const w = 4;
                        const h = 4;
                        const itemsPerRow = Math.floor(cols / w);
                        const row = Math.floor(index / itemsPerRow);
                        const col = (index % itemsPerRow) * w;
                        
                        normalizedLayouts.lg.push({ i: id, x: col, y: row * h, w, h });
                        normalizedLayouts.md.push({ i: id, x: col, y: row * h, w, h });
                        normalizedLayouts.sm.push({ i: id, x: 0, y: row * h, w: 2, h });
                    }
                });
                
                // Function to detect and fix overlapping positions
                const fixOverlaps = (layout: any[], cols: number) => {
                    if (layout.length === 0) return layout;
                    
                    const fixed: any[] = [];
                    const occupied = new Map<string, string>(); // position -> widget id
                    
                    // Sort by y, then x to process top-to-bottom, left-to-right
                    const sorted = [...layout].sort((a, b) => {
                        if (a.y !== b.y) return a.y - b.y;
                        return a.x - b.x;
                    });
                    
                    sorted.forEach((item) => {
                        let x = item.x || 0;
                        let y = item.y || 0;
                        const w = item.w || 4;
                        const h = item.h || 4;
                        let placed = false;
                        
                        // Check if current position is free
                        const checkPosition = (px: number, py: number) => {
                            if (px + w > cols || px < 0 || py < 0) return false;
                            for (let dy = 0; dy < h; dy++) {
                                for (let dx = 0; dx < w; dx++) {
                                    const key = `${px + dx}-${py + dy}`;
                                    if (occupied.has(key) && occupied.get(key) !== item.i) {
                                        return false;
                                    }
                                }
                            }
                            return true;
                        };
                        
                        // Try original position first
                        if (checkPosition(x, y)) {
                            placed = true;
                        } else {
                            // Try to find a free position
                            const maxY = Math.max(...fixed.map(i => (i.y + i.h) || 0), 0);
                            for (let tryY = 0; tryY <= maxY + h && !placed; tryY += h) {
                                for (let tryX = 0; tryX <= cols - w && !placed; tryX += w) {
                                    if (checkPosition(tryX, tryY)) {
                                        x = tryX;
                                        y = tryY;
                                        placed = true;
                                    }
                                }
                            }
                        }
                        
                        // Place the item
                        const placedItem = { ...item, x, y, w, h };
                        fixed.push(placedItem);
                        
                        // Mark positions as occupied
                        for (let dy = 0; dy < h; dy++) {
                            for (let dx = 0; dx < w; dx++) {
                                occupied.set(`${x + dx}-${y + dy}`, item.i);
                            }
                        }
                    });
                    
                    return fixed;
                };
                
                // Fix overlaps for each breakpoint
                normalizedLayouts.lg = fixOverlaps(normalizedLayouts.lg, 12);
                normalizedLayouts.md = fixOverlaps(normalizedLayouts.md, 10);
                normalizedLayouts.sm = fixOverlaps(normalizedLayouts.sm, 6);
                
                dispatch(loadDashboard({
                    ...parsed,
                    layouts: normalizedLayouts
                }));
                hasHandledInitialLayoutRef.current = true;
            } catch (e) {
                console.error("Failed to load dashboard", e);
            }
        } else {
            // No saved data, mark as handled
            hasHandledInitialLayoutRef.current = true;
        }
        setIsLoaded(true);
    }, [dispatch]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Persist to local storage
    useEffect(() => {
        if (mounted && isLoaded && Object.keys(widgets).length > 0) {
            // Ensure all layouts are valid arrays
            const validLayouts = {
                lg: Array.isArray(layouts.lg) ? layouts.lg : [],
                md: Array.isArray(layouts.md) ? layouts.md : [],
                sm: Array.isArray(layouts.sm) ? layouts.sm : [],
            };
            
            // Filter out any layout items that don't have corresponding widgets
            const filterLayout = (layout: any[]) => {
                return layout.filter((item: any) => widgets[item.i] && 
                    typeof item.x === 'number' && 
                    typeof item.y === 'number' &&
                    typeof item.w === 'number' &&
                    typeof item.h === 'number'
                );
            };
            
            const filteredLayouts = {
                lg: filterLayout(validLayouts.lg),
                md: filterLayout(validLayouts.md),
                sm: filterLayout(validLayouts.sm),
            };
            
            try {
                localStorage.setItem('finboard_dashboard', JSON.stringify({ 
                    layouts: filteredLayouts, 
                    widgets, 
                    theme 
                }));
            } catch (e) {
                console.error("Failed to save dashboard to localStorage", e);
            }
        }
    }, [layouts, widgets, theme, mounted, isLoaded]);

    const handleLayoutChange = (currentLayout: any[], allLayouts: any) => {
        if (!mounted || !allLayouts || !isLoaded) return;
        
        // Skip the first layout change after initial load (it's usually from react-grid-layout initialization)
        if (isInitialLoadRef.current && hasHandledInitialLayoutRef.current) {
            isInitialLoadRef.current = false;
            // Don't update on initial render - use the loaded layout
            return;
        }
        
        // Update all breakpoints that exist in our state
        const breakpoints: ('lg' | 'md' | 'sm')[] = ['lg', 'md', 'sm'];
        let hasChanges = false;
        
        breakpoints.forEach(bp => {
            if (allLayouts[bp] && Array.isArray(allLayouts[bp])) {
                // Ensure all layout items have valid properties and match existing widgets
                const validLayout = allLayouts[bp]
                    .filter((item: any) => widgets[item.i]) // Only keep items that have widgets
                    .map((item: any) => ({
                        i: item.i,
                        x: Math.max(0, Number(item.x) || 0),
                        y: Math.max(0, Number(item.y) || 0),
                        w: Math.max(1, Number(item.w) || 4),
                        h: Math.max(1, Number(item.h) || 4),
                        minW: item.minW,
                        minH: item.minH,
                        maxW: item.maxW,
                        maxH: item.maxH,
                    }));
                
                // Check if layout actually changed
                const currentLayoutForBp = layouts[bp] || [];
                if (JSON.stringify(currentLayoutForBp) !== JSON.stringify(validLayout)) {
                    dispatch(updateLayout({ layout: validLayout, breakpoint: bp }));
                    hasChanges = true;
                }
            }
        });
    };

    const onAddWidget = (type: 'card' | 'table' | 'chart') => {
        const defaultSettings: any = {};
        if (type === 'chart') {
            defaultSettings.chartType = 'line';
            defaultSettings.chartInterval = 'daily';
        } else if (type === 'card') {
            defaultSettings.cardType = 'single';
        }
        dispatch(addWidget({
            type,
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            settings: defaultSettings,
        }));
    };

    const handleExport = () => {
        downloadJson({ layouts, widgets, theme }, `finboard-backup-${new Date().toISOString().split('T')[0]}.json`);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await readJsonFile(file);
            if (data && data.layouts && data.widgets) {
                dispatch(loadDashboard(data));
            } else {
                alert('Invalid dashboard file format');
            }
        } catch (err) {
            alert('Failed to parse file');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleTheme = () => {
        dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
    };

    const handleLoadTemplate = (id: string) => {
        const template = (templates as any)[id]; // Simple lookup
        if (template) {
            // Preserve template's theme or use current theme if template doesn't specify
            dispatch(loadDashboard({
                layouts: template.layouts,
                widgets: template.widgets,
                theme: template.theme || theme
            }));
            setShowTemplates(false);
        }
    };

    if (!mounted) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    const editingWidget = editingWidgetId ? widgets[editingWidgetId] : null;
    const hasWidgets = Object.keys(widgets).length > 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 dark:bg-black transition-colors">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <span className="font-bold">Fin</span>
                        </div>
                        Finance Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {Object.keys(widgets).length} active widgets • Real-time data
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded flex items-center gap-1 text-sm font-medium"
                        >
                            <Layout size={18} /> Templates
                        </button>
                        {showTemplates && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-xl z-20 overflow-hidden">
                                <div className="p-3 border-b border-gray-200 dark:border-slate-800">
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Dashboard Templates</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">Choose a pre-built layout</div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {Object.values(templateInfos).map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleLoadTemplate(template.id)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-200 transition-colors border-b border-gray-100 dark:border-slate-800 last:border-0 group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        {template.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {template.description}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                                                            {template.category}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {Object.keys(templates[template.id]?.widgets || {}).length} widgets
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-all duration-300 hover:scale-105 relative group"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        <div className="relative">
                            {theme === 'light' ? (
                                <Moon size={18} className="transition-transform duration-300" />
                            ) : (
                                <Sun size={18} className="transition-transform duration-300 rotate-0" />
                            )}
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {theme === 'light' ? 'Dark' : 'Light'} Mode
                        </span>
                    </button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1"></div>

                    <button onClick={() => onAddWidget('card')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/20 text-sm font-medium transition-all hover:scale-105 flex items-center gap-2">
                        + Add Widget
                    </button>
                    <button onClick={() => onAddWidget('chart')} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded shadow-sm text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 dark:text-white transition-colors">+ Chart</button>
                    <button onClick={() => onAddWidget('table')} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded shadow-sm text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 dark:text-white transition-colors">+ Table</button>
                </div>
            </div>

            {!hasWidgets && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900/50">
                    <div className="text-gray-400 mb-2">Dataset is empty</div>
                    <p className="text-gray-500 mb-4">Add your first widget to get started</p>
                    <button onClick={() => onAddWidget('card')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Finance Card</button>
                </div>
            )}

            {isLoaded && (
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={30}
                    draggableHandle=".drag-handle"
                    onLayoutChange={handleLayoutChange}
                    margin={[16, 16]}
                    containerPadding={[0, 0]}
                    isDraggable={true}
                    isResizable={true}
                    preventCollision={false}
                    verticalCompact={false}
                >
                    {Object.values(widgets).map((widget) => {
                        // Ensure widget has a layout item - if not, it will be added by the layout system
                        return (
                            <div key={widget.id}>
                                <WidgetShell
                                    id={widget.id}
                                    title={widget.title}
                                    onEdit={() => setEditingWidgetId(widget.id)}
                                >
                                    <WidgetRenderer widget={widget} />
                                </WidgetShell>
                            </div>
                        );
                    })}
                </ResponsiveGridLayout>
            )}

            {editingWidget && (
                <WidgetConfigModal
                    widget={editingWidget}
                    isOpen={!!editingWidget}
                    onClose={() => setEditingWidgetId(null)}
                />
            )}
        </div>
    );
}
