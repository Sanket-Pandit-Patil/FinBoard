import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardState, WidgetConfig } from '@/types/widget';
import { v4 as uuidv4 } from 'uuid';

const initialState: DashboardState = {
    layouts: { lg: [], md: [], sm: [] },
    widgets: {},
    theme: 'light',
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        addWidget: (state, action: PayloadAction<Omit<WidgetConfig, 'id'>>) => {
            const id = uuidv4();
            const newWidget = { ...action.payload, id };
            state.widgets[id] = newWidget;

            // Calculate next available position to avoid overlap
            const findNextPosition = (currentLayout: any[], cols: number) => {
                if (currentLayout.length === 0) {
                    return { x: 0, y: 0 };
                }
                
                // Find the maximum y value
                const maxY = Math.max(...currentLayout.map(item => item.y + item.h), 0);
                
                // Try to find an empty spot, otherwise place at the bottom
                for (let y = 0; y <= maxY + 4; y++) {
                    for (let x = 0; x <= cols - 4; x += 4) {
                        const occupied = currentLayout.some(item => 
                            item.x < x + 4 && item.x + item.w > x &&
                            item.y < y + 4 && item.y + item.h > y
                        );
                        if (!occupied) {
                            return { x, y };
                        }
                    }
                }
                
                // If no spot found, place at the bottom
                return { x: 0, y: maxY + 4 };
            };

            const lgPos = findNextPosition(state.layouts.lg, 12);
            const newItemLg = { i: id, x: lgPos.x, y: lgPos.y, w: 4, h: 4 };
            
            const mdPos = findNextPosition(state.layouts.md, 10);
            const newItemMd = { i: id, x: mdPos.x, y: mdPos.y, w: 4, h: 4 };
            
            const smPos = findNextPosition(state.layouts.sm, 6);
            const newItemSm = { i: id, x: smPos.x, y: smPos.y, w: 2, h: 4 };

            state.layouts.lg = [...state.layouts.lg, newItemLg];
            state.layouts.md = [...state.layouts.md, newItemMd];
            state.layouts.sm = [...state.layouts.sm, newItemSm];
        },
        removeWidget: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            delete state.widgets[id];
            state.layouts.lg = state.layouts.lg.filter(item => item.i !== id);
            state.layouts.md = state.layouts.md.filter(item => item.i !== id);
            state.layouts.sm = state.layouts.sm.filter(item => item.i !== id);
        },
        updateLayout: (state, action: PayloadAction<{ layout: any[], breakpoint: 'lg' | 'md' | 'sm' }>) => {
            state.layouts[action.payload.breakpoint] = action.payload.layout;
        },
        updateWidget: (state, action: PayloadAction<{ id: string; changes: Partial<WidgetConfig> }>) => {
            const { id, changes } = action.payload;
            if (state.widgets[id]) {
                state.widgets[id] = { ...state.widgets[id], ...changes };
            }
        },
        setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
            state.theme = action.payload;
        },
        loadDashboard: (state, action: PayloadAction<DashboardState>) => {
            return action.payload;
        }
    },
});

export const { addWidget, removeWidget, updateLayout, updateWidget, setTheme, loadDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
