import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardState, WidgetConfig } from '@/types/widget';
import { v4 as uuidv4 } from 'uuid';

const initialState: DashboardState = {
    layouts: { lg: [], md: [], sm: [] },
    widgets: {},
    theme: 'dark',
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        addWidget: (state, action: PayloadAction<Omit<WidgetConfig, 'id'>>) => {
            const id = uuidv4();
            const newWidget = { ...action.payload, id };
            state.widgets[id] = newWidget;

            // Calculate next available position - simple scanning algorithm (First Fit)
            const findNextPosition = (currentLayout: any[], cols: number, widgetW: number, widgetH: number) => {
                // Return 0,0 if empty
                if (!currentLayout || currentLayout.length === 0) {
                    return { x: 0, y: 0 };
                }

                // Helper to check collision
                const collides = (x: number, y: number, w: number, h: number) => {
                    return currentLayout.some(item => {
                        if (item.i === id) return false;

                        // Explicitly cast to Number to prevent string concatenation bugs and handle NaNs
                        const itemX = Number(item.x) || 0;
                        const itemY = Number(item.y) || 0;
                        const itemW = Number(item.w) || 4; // Default width if missing
                        const itemH = Number(item.h) || 4; // Default height if missing

                        return (
                            x < itemX + itemW &&
                            x + w > itemX &&
                            y < itemY + itemH &&
                            y + h > itemY
                        );
                    });
                };

                let y = 0;
                while (true) {
                    for (let x = 0; x <= cols - widgetW; x++) {
                        if (!collides(x, y, widgetW, widgetH)) {
                            return { x, y };
                        }
                    }
                    y++; // Move down one row and scan again
                    // Safety break
                    if (y > 1000) return { x: 0, y: 0 };
                }
            };

            const newItemLg = {
                i: id,
                ...findNextPosition(state.layouts.lg, 12, 4, 4),
                w: 4, h: 4
            };

            const newItemMd = {
                i: id,
                ...findNextPosition(state.layouts.md, 10, 4, 4),
                w: 4, h: 4
            };

            const newItemSm = {
                i: id,
                ...findNextPosition(state.layouts.sm, 6, 2, 4),
                w: 2, h: 4
            };

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
