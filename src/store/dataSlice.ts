import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CacheEntry {
    data: any;
    timestamp: number;
}

interface DataState {
    cache: Record<string, CacheEntry>;
}

const initialState: DataState = {
    cache: {},
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        cacheData: (state, action: PayloadAction<{ key: string; data: any }>) => {
            state.cache[action.payload.key] = {
                data: action.payload.data,
                timestamp: Date.now(),
            };
        },
        clearCache: (state) => {
            state.cache = {};
        }
    },
});

export const { cacheData, clearCache } = dataSlice.actions;

export const selectCachedData = (state: { data: DataState }, key: string) => {
    const entry = state.data.cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_DURATION) return null; // Expired
    return entry.data;
};

export default dataSlice.reducer;
