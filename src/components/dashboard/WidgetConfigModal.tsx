'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { updateWidget } from '@/store/dashboardSlice';
import { WidgetConfig, ChartType, ChartInterval, CardType } from '@/types/widget';
import { adapters, AdapterId } from '@/adapters/apiAdapters';
import JsonExplorer from './JsonExplorer';
import { X, Play, Save, AlertCircle } from 'lucide-react';
import { getApiKeyStatus } from '@/utils/apiKeyValidator';
import { rateLimiter } from '@/utils/rateLimiter';

interface WidgetConfigModalProps {
    widget: WidgetConfig;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (updates: Partial<WidgetConfig>) => void;
}

export default function WidgetConfigModal({ widget, isOpen, onClose, onSave }: WidgetConfigModalProps) {
    const dispatch = useAppDispatch();
    const [title, setTitle] = useState(widget.title);
    const [provider, setProvider] = useState<AdapterId>(widget.apiConfig?.provider || 'alpha-vantage');
    const [endpoint, setEndpoint] = useState(widget.apiConfig?.endpoint || '');
    const [params, setParams] = useState<Record<string, string>>(widget.apiConfig?.params || {});
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFieldPath, setSelectedFieldPath] = useState<string>(''); // For now just one field mapping demo

    const [refreshInterval, setRefreshInterval] = useState(widget.settings?.refreshInterval || 0);
    const [viewMode, setViewMode] = useState<'single' | 'list'>(widget.settings?.viewMode || 'single');
    const [cardType, setCardType] = useState<CardType>(widget.settings?.cardType || (widget.settings?.viewMode === 'list' ? 'watchlist' : 'single'));
    const [chartType, setChartType] = useState<ChartType>(widget.settings?.chartType || 'line');
    const [chartInterval, setChartInterval] = useState<ChartInterval>(widget.settings?.chartInterval || 'daily');
    const [description, setDescription] = useState(widget.description || '');
    const [format, setFormat] = useState<'number' | 'currency' | 'percent' | 'none'>(widget.format || 'none');
    const [dataMap, setDataMap] = useState<Record<string, string>>(widget.dataMap || {});
    const [mappingFieldName, setMappingFieldName] = useState<string>('value'); // Field name for new mapping

    useEffect(() => {
        setTitle(widget.title);
        if (widget.apiConfig) {
            setProvider(widget.apiConfig.provider);
            setEndpoint(widget.apiConfig.endpoint);
            setParams(widget.apiConfig.params);
        }
        setRefreshInterval(widget.settings?.refreshInterval || 0);
        setViewMode(widget.settings?.viewMode || 'single');
        setCardType(widget.settings?.cardType || (widget.settings?.viewMode === 'list' ? 'watchlist' : 'single'));
        setChartType(widget.settings?.chartType || 'line');
        setChartInterval(widget.settings?.chartInterval || 'daily');
        setDescription(widget.description || '');
        setFormat((widget.format || 'none') as 'number' | 'currency' | 'percent' | 'none');
        setDataMap(widget.dataMap || {});
    }, [widget]);

    const handleFetch = async () => {
        setLoading(true);
        setError(null);

        try {
            // Check API key status
            const keyStatus = getApiKeyStatus(provider);
            if (keyStatus.isDemo) {
                setError('Demo key detected. Configure API key in .env.local for live data.');
                setLoading(false);
                return;
            }

            // Check rate limit
            const rateLimitCheck = rateLimiter.canMakeRequest(provider);
            if (!rateLimitCheck.allowed) {
                setError(
                    rateLimitCheck.retryAfter
                        ? `${rateLimitCheck.reason}. Retry after ${rateLimitCheck.retryAfter} seconds.`
                        : rateLimitCheck.reason || 'Rate limit exceeded'
                );
                setLoading(false);
                return;
            }

            // Validate required params
            const requiredParams = adapters[provider].endpoints.find(e => e.value === endpoint)?.params || [];
            const missingParams = requiredParams.filter(p => !params[p] || params[p].trim() === '');
            if (missingParams.length > 0) {
                setError(`Missing required parameters: ${missingParams.join(', ')}`);
                setLoading(false);
                return;
            }

            const adapter = adapters[provider];
            const data = await adapter.fetch(endpoint, params);
            setApiResponse(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data. Check API key and rate limits.');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldSelect = (path: string, value: any) => {
        // Map the selected field to the current mapping field name
        setDataMap(prev => ({ ...prev, [mappingFieldName]: path }));
    };

    const handleRemoveField = (fieldName: string) => {
        setDataMap(prev => {
            const newMap = { ...prev };
            delete newMap[fieldName];
            return newMap;
        });
    };

    const handleAddFieldMapping = () => {
        if (mappingFieldName && !dataMap[mappingFieldName]) {
            // Field name is set, user can now select a path
            // The mapping will be created when user clicks a field in JsonExplorer
        }
    };

    const handleSave = () => {
        const updates = {
            title,
            description,
            format,
            apiConfig: { provider, endpoint, params },
            dataMap,
            settings: {
                ...widget.settings,
                refreshInterval,
                viewMode: isCard && cardType !== 'single' ? 'list' : viewMode,
                cardType: isCard ? cardType : undefined,
                chartType: isChart ? chartType : undefined,
                chartInterval: isChart ? chartInterval : undefined
            }
        };

        if (onSave) {
            onSave(updates);
        } else {
            dispatch(updateWidget({
                id: widget.id,
                changes: updates
            }));
        }
        onClose();
    };

    if (!isOpen) return null;

    const currentAdapter = adapters[provider];

    const isCard = widget.type === 'card';
    const isTable = widget.type === 'table';
    const isChart = widget.type === 'chart';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`bg-[#0F172A] w-full max-w-2xl rounded-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] transition-all duration-200`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0F172A]">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Add New Widget</h2>
                        <p className="text-sm text-slate-400">Connect to APIs and build your custom dashboard</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Widget Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Widget Name</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#1E293B] border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981] placeholder-slate-500"
                            placeholder="e.g., Bitcoin Price Tracker"
                        />
                    </div>

                    {/* API Key Status Warning */}
                    {(() => {
                        const keyStatus = getApiKeyStatus(provider);
                        const remaining = rateLimiter.getRemainingRequests(provider);
                        return (
                            <div className="space-y-2">
                                {keyStatus.isDemo && (
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                                        <AlertCircle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-yellow-500 text-xs font-semibold">Demo API Key</div>
                                            <div className="text-yellow-400/80 text-xs mt-0.5">
                                                Configure {keyStatus.provider} API key in .env.local for live data
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!keyStatus.isDemo && (
                                    <div className="p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs">
                                        <div className="text-slate-400">Rate Limit: {remaining.perMinute} requests/min remaining</div>
                                        {remaining.perDay !== undefined && (
                                            <div className="text-slate-500 mt-0.5">{remaining.perDay} requests/day remaining</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Data Source Configuration */}
                    <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Provider & Endpoint</label>
                                <span className="text-xs text-slate-500">Switch providers easily</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Provider</label>
                                    <select
                                        value={provider}
                                        onChange={e => {
                                            setProvider(e.target.value as any);
                                            // Reset endpoint when provider changes
                                            const newProvider = adapters[e.target.value as AdapterId];
                                            if (newProvider && newProvider.endpoints.length > 0) {
                                                setEndpoint(newProvider.endpoints[0].value);
                                                setParams({});
                                            }
                                        }}
                                        className="w-full bg-[#1E293B] border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                    >
                                        {Object.values(adapters).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Endpoint</label>
                                    <select
                                        value={endpoint}
                                        onChange={e => {
                                            setEndpoint(e.target.value);
                                            // Reset params when endpoint changes
                                            setParams({});
                                        }}
                                        className="w-full bg-[#1E293B] border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                    >
                                        {adapters[provider].endpoints.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Params inputs */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Parameters</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                    {adapters[provider].endpoints.find(e => e.value === endpoint)?.params.map(param => (
                                        <input
                                            key={param}
                                            type="text"
                                            placeholder={param.toUpperCase()}
                                            value={params[param] || ''}
                                            onChange={e => setParams(prev => ({ ...prev, [param]: e.target.value }))}
                                            className="bg-[#1E293B] border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981] w-full"
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleFetch}
                                    disabled={loading}
                                    className={`px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-[#10B981] hover:bg-[#059669] shadow-lg shadow-emerald-900/20'
                                        }`}
                                >
                                    {loading ? 'Testing...' : 'Test'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </div>
                    )}
                    {apiResponse && !error && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm flex items-center gap-2">
                            <Check size={16} />
                            API connection successful!
                        </div>
                    )}

                    {/* Settings Row */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Refresh Interval (Sec)</label>
                            <input
                                type="number"
                                value={refreshInterval > 0 ? refreshInterval / 1000 : ''}
                                onChange={(e) => setRefreshInterval(Number(e.target.value) * 1000)}
                                placeholder="Manual"
                                className="w-full bg-[#1E293B] border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                            />
                        </div>
                        {isCard && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Card Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['single', 'watchlist', 'market-gainers', 'performance', 'financial'] as CardType[]).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setCardType(type);
                                                if (type !== 'single') setViewMode('list');
                                            }}
                                            className={`text-xs font-medium py-2 rounded-md transition-all capitalize border ${cardType === type
                                                    ? 'bg-[#10B981] text-white border-[#10B981] shadow'
                                                    : 'bg-[#1E293B] text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                                                }`}
                                        >
                                            {type === 'market-gainers' ? 'Gainers' : type === 'single' ? 'Single Value' : type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {isChart && (
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chart Type</label>
                                <div className="flex bg-[#1E293B] p-1 rounded-lg border border-slate-700">
                                    {(['line', 'candle', 'bar'] as ChartType[]).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setChartType(type)}
                                            className={`flex-1 text-xs font-medium py-2 rounded-md transition-all capitalize ${chartType === type ? 'bg-[#10B981] text-white shadow' : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {isChart && (
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Interval</label>
                                <div className="flex bg-[#1E293B] p-1 rounded-lg border border-slate-700">
                                    {(['daily', 'weekly', 'monthly'] as ChartInterval[]).map((interval) => (
                                        <button
                                            key={interval}
                                            onClick={() => setChartInterval(interval)}
                                            className={`flex-1 text-xs font-medium py-2 rounded-md transition-all capitalize ${chartInterval === interval ? 'bg-[#10B981] text-white shadow' : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {interval}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {isCard && cardType === 'single' && (
                            <>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="e.g. Daily Close"
                                        className="w-full bg-[#1E293B] border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Format</label>
                                    <select
                                        value={format}
                                        onChange={(e) => setFormat(e.target.value as any)}
                                        className="w-full bg-[#1E293B] border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                    >
                                        <option value="none">None</option>
                                        <option value="number">Number</option>
                                        <option value="currency">Currency</option>
                                        <option value="percent">Percentage</option>
                                    </select>
                                </div>
                            </>
                        )}
                        {isTable && (
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Format</label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as any)}
                                    className="w-full bg-[#1E293B] border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                >
                                    <option value="none">None</option>
                                    <option value="number">Number</option>
                                    <option value="currency">Currency</option>
                                    <option value="percent">Percentage</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* JSON Explorer Area */}
                    {apiResponse && (
                        <div className="space-y-4 border-t border-slate-800 pt-6">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Field Mapping</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={mappingFieldName}
                                        onChange={(e) => setMappingFieldName(e.target.value)}
                                        placeholder="Field name"
                                        className="bg-[#1E293B] border border-slate-700 text-white text-xs rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                    />
                                    <span className="text-xs text-slate-500">→ Click field to map</span>
                                </div>
                            </div>

                            {/* Mapped Fields Display - Show first */}
                            {Object.keys(dataMap).length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mapped Fields</label>
                                    <div className="grid gap-2">
                                        {Object.entries(dataMap).map(([key, path]) => (
                                            <div key={key} className="flex items-center justify-between text-sm bg-slate-800/50 p-3 rounded border border-slate-700 group">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-300 capitalize font-medium">{key}:</span>
                                                    <span className="text-emerald-400 font-mono text-xs">{path}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveField(key)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity px-2"
                                                    title="Remove mapping"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-[#1E293B] rounded-lg border border-slate-700 p-4 max-h-60 overflow-y-auto font-mono text-sm text-slate-300">
                                <div className="text-xs text-slate-500 mb-2">Click any field value below to map it to "{mappingFieldName}"</div>
                                <JsonExplorer
                                    data={apiResponse}
                                    onSelectPath={(path: string, value: any) => handleFieldSelect(path, value)}
                                    selectedPath={dataMap[mappingFieldName] || ''}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-[#0F172A] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                    >
                        {widget.id ? 'Save Changes' : 'Add Widget'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper icons
function Check({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    )
}
