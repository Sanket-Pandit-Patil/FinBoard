'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateLayout, addWidget, loadDashboard, setTheme, updateWidget } from '@/store/dashboardSlice';
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
    const [creatingWidgetType, setCreatingWidgetType] = React.useState<'card' | 'table' | 'chart' | null>(null);
    const [showTemplates, setShowTemplates] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isInitialLoadRef = useRef(true);
    const hasHandledInitialLayoutRef = useRef(false);
    const ignoreLayoutChangeRef = useRef(false);

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
                            for (let tryY = 0; tryY <= maxY + h && !placed; tryY += w) {
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
                    layouts: normalizedLayouts,
                    theme: parsed.theme || 'dark' // Default to dark if not set
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
        if (ignoreLayoutChangeRef.current) return; // Ignore updates during addition

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
        setCreatingWidgetType(type);
    };

    const [layoutVersion, setLayoutVersion] = useState(0);

    // ...

    const handleSaveWidget = (updates: any) => {
        if (editingWidgetId) {
            dispatch(updateWidget({ id: editingWidgetId, changes: updates }));
            setEditingWidgetId(null);
        } else if (creatingWidgetType) {
            // Creating a new widget
            ignoreLayoutChangeRef.current = true;
            setTimeout(() => {
                ignoreLayoutChangeRef.current = false;
            }, 1000);

            dispatch(addWidget({
                type: creatingWidgetType,
                title: updates.title || `New ${creatingWidgetType.charAt(0).toUpperCase() + creatingWidgetType.slice(1)}`,
                description: updates.description,
                apiConfig: updates.apiConfig,
                dataMap: updates.dataMap,
                settings: updates.settings,
                format: updates.format
            }));

            // Force RGL to remount and pick up the new layout from Redux
            setLayoutVersion(v => v + 1);
            setCreatingWidgetType(null);
        }
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
            // Keep current theme instead of template's theme
            dispatch(loadDashboard({
                layouts: template.layouts,
                widgets: template.widgets,
                theme: theme // Force current theme
            }));
            setShowTemplates(false);
        }
    };

    if (!mounted) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    const editingWidget = editingWidgetId ? widgets[editingWidgetId] : null;

    // Temporary widget object for creation mode
    const creationWidget: any = creatingWidgetType ? {
        id: 'temp-new',
        type: creatingWidgetType,
        title: `New ${creatingWidgetType.charAt(0).toUpperCase() + creatingWidgetType.slice(1)}`,
        apiConfig: { provider: 'alpha-vantage', endpoint: '', params: {} },
        dataMap: {},
        settings: {
            refreshInterval: 0,
            viewMode: 'single',
            chartType: creatingWidgetType === 'chart' ? 'line' : undefined,
            chartInterval: creatingWidgetType === 'chart' ? 'daily' : undefined,
            cardType: creatingWidgetType === 'card' ? 'single' : undefined
        }
    } : null;

    const hasWidgets = Object.keys(widgets).length > 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-950 to-slate-950">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/50 dark:border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <span className="font-bold">F</span>
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                            FinBoard
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 flex items-center gap-2 pl-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>{Object.keys(widgets).length} active widgets</span>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span>Real-time</span>
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="px-4 py-2 glass dark:glass-dark hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-full flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
                        >
                            <Layout size={16} /> Templates
                        </button>
                        {showTemplates && (
                            <div className="absolute top-full right-0 mt-2 w-80 glass dark:glass-dark rounded-xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-4 border-b border-gray-200/50 dark:border-white/5">
                                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Templates</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">Select a layout to get started</div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {Object.values(templateInfos).map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleLoadTemplate(template.id)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0 group"
                                        >
                                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                {template.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {template.description}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2.5 glass dark:glass-dark hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-full text-gray-600 dark:text-gray-300 transition-all hover:scale-105 shadow-sm"
                        title="Toggle Theme"
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

                    <div className="flex bg-gray-100 dark:bg-white/5 rounded-full p-1 border border-gray-200 dark:border-white/5">
                        <button onClick={() => onAddWidget('card')} className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all text-gray-700 dark:text-gray-200">
                            + Card
                        </button>
                        <button onClick={() => onAddWidget('chart')} className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all text-gray-700 dark:text-gray-200">
                            + Chart
                        </button>
                        <button onClick={() => onAddWidget('table')} className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all text-gray-700 dark:text-gray-200">
                            + Table
                        </button>
                    </div>
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
                    key={`grid-${layoutVersion}`}
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
            )
            }

            {
                (editingWidget || creationWidget) && (
                    <WidgetConfigModal
                        widget={editingWidget || creationWidget}
                        isOpen={!!editingWidget || !!creationWidget}
                        onClose={() => {
                            setEditingWidgetId(null);
                            setCreatingWidgetType(null);
                        }}
                        onSave={handleSaveWidget}
                    />
                )
            }
        </div >
    );
}
