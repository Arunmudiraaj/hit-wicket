/**
 * Auth Slice
 * Holds the authenticated user's data synced from Better Auth via useAuth() hook.
 * Keeps auth state in Redux so any component can access it without calling useSession() directly.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    image?: string | null;
}

interface AuthState {
    user:            AuthUser | null;
    isAuthenticated: boolean;
    isLoading:       boolean;
}

const initialState: AuthState = {
    user:            null,
    isAuthenticated: false,
    isLoading:       true, // start true; useAuth() resolves on first render
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthUser(state, action: PayloadAction<AuthUser>) {
            state.user            = action.payload;
            state.isAuthenticated = true;
            state.isLoading       = false;
        },
        clearAuthUser(state) {
            state.user            = null;
            state.isAuthenticated = false;
            state.isLoading       = false;
        },
        setAuthLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
    },
});

export const { setAuthUser, clearAuthUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;