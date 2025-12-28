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

            // Calculate next available position - place next to the last widget
            const findNextPosition = (currentLayout: any[], cols: number, widgetWidth: number = 4) => {
                if (currentLayout.length === 0) {
                    return { x: 0, y: 0 };
                }
                
                // Sort by creation order (by y position, then x position) to find the last widget
                // Find the widget with the highest y position, and if multiple, the one with highest x
                const sortedLayout = [...currentLayout].sort((a, b) => {
                    const aBottom = a.y + a.h;
                    const bBottom = b.y + b.h;
                    if (aBottom !== bBottom) return bBottom - aBottom; // Higher y first
                    return b.x - a.x; // Then higher x
                });
                
                const lastWidget = sortedLayout[0];
                const lastX = lastWidget.x;
                const lastY = lastWidget.y;
                const lastW = lastWidget.w;
                const lastH = lastWidget.h;
                
                // Try to place to the right of the last widget
                const tryRightX = lastX + lastW;
                if (tryRightX + widgetWidth <= cols) {
                    // Check if position is free
                    const isOccupied = currentLayout.some(item => 
                        item.x < tryRightX + widgetWidth && item.x + item.w > tryRightX &&
                        item.y < lastY + lastH && item.y + item.h > lastY
                    );
                    if (!isOccupied) {
                        return { x: tryRightX, y: lastY };
                    }
                }
                
                // If can't place to the right, try below the last widget
                const tryBelowY = lastY + lastH;
                if (tryBelowY + 4 <= 100) { // reasonable max height
                    // Check if position is free
                    const isOccupied = currentLayout.some(item => 
                        item.x < lastX + widgetWidth && item.x + item.w > lastX &&
                        item.y < tryBelowY + 4 && item.y + item.h > tryBelowY
                    );
                    if (!isOccupied) {
                        return { x: lastX, y: tryBelowY };
                    }
                }
                
                // If can't place to the right or below, find the next available spot in the same row
                for (let x = 0; x <= cols - widgetWidth; x += widgetWidth) {
                    const isOccupied = currentLayout.some(item => 
                        item.x < x + widgetWidth && item.x + item.w > x &&
                        item.y < lastY + lastH && item.y + item.h > lastY
                    );
                    if (!isOccupied) {
                        return { x, y: lastY };
                    }
                }
                
                // If no space in current row, place in a new row below all widgets
                const maxY = Math.max(...currentLayout.map(item => item.y + item.h), 0);
                return { x: 0, y: maxY };
            };

            const lgPos = findNextPosition(state.layouts.lg, 12, 4);
            const newItemLg = { i: id, x: lgPos.x, y: lgPos.y, w: 4, h: 4 };
            
            const mdPos = findNextPosition(state.layouts.md, 10, 4);
            const newItemMd = { i: id, x: mdPos.x, y: mdPos.y, w: 4, h: 4 };
            
            const smPos = findNextPosition(state.layouts.sm, 6, 2);
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
