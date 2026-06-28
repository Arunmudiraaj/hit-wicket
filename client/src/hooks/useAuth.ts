/**
 * useAuth — Syncs the Better Auth session into Redux on every render.
 *
 * Call once in App.tsx. This hook:
 *   1. Reads the live Better Auth session via useSession().
 *   2. Dispatches authSlice actions to keep Redux in sync.
 *   3. Stores the session token in sessionSlice.authToken so the
 *      socket handshake can forward it to the server.
 *   4. Updates sessionSlice.playerId to the real user ID when authenticated,
 *      or clears it to the saved guest ID when logged out.
 *
 * Auth changes take effect on the NEXT socket connection (not mid-session).
 * See implementation_plan.md — Open Question #1 for rationale.
 */

import { useEffect } from 'react';
import { useSession } from '../lib/auth';
import { useAppDispatch } from './useTypedRedux';
import { setAuthUser, clearAuthUser, setAuthLoading } from '../store/slices/authSlice';
import { setPlayerId, setPlayerName } from '../store/slices/sessionSlice';
import { storage } from '../utils/storage';

export function useAuth(): void {
    const { data: session, isPending } = useSession();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setAuthLoading(isPending));

        if (isPending) return;

        if (session?.user && session?.session?.token) {
            // Authenticated user
            dispatch(setAuthUser({
                id:    session.user.id,
                name:  session.user.name,
                email: session.user.email,
                image: session.user.image ?? null,
            }));

            // Use real user ID as playerId for the current session.
            // Not saved to localStorage (cookie handles re-identification).
            dispatch(setPlayerId(session.user.id));

            // Keep playerName in sync with auth name
            dispatch(setPlayerName(session.user.name));
        } else {
            // Not authenticated — clear auth state and restore guest ID
            dispatch(clearAuthUser());

            // Restore guest ID from localStorage if available
            const savedGuestId = storage.getPlayerId();
            if (savedGuestId?.startsWith('guest_')) {
                dispatch(setPlayerId(savedGuestId));
            }
        }
    }, [session, isPending, dispatch]);
}
