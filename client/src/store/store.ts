import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
// Add more slices here as needed

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
