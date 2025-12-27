import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './dashboardSlice';
import dataReducer from './dataSlice';

export const store = configureStore({
    reducer: {
        dashboard: dashboardReducer,
        data: dataReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
