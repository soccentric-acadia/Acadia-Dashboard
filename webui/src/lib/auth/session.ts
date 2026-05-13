// Session management backed by the Acadia Server.
// Login/logout call the real REST API and rely on server-issued session cookies.

import { authLogin, authLogout } from "@/lib/api/client";

export interface SessionUser {
    user_id: string;
    username: string;
}

const SESSION_KEY = "acadia_session_user";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attempt login against the Server.
 * On success the server sets a session cookie and we cache the user info in
 * sessionStorage for quick UI reads (no password ever stored).
 * Throws ApiError on invalid credentials or server errors.
 */
export async function login(username: string, password: string): Promise<void> {
    const user = await authLogin(username, password);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Call the Server logout endpoint and clear local session info.
 * Safe to call even when not logged in.
 */
export async function logout(): Promise<void> {
    try {
        await authLogout();
    } catch {
        // Best-effort — clear local state regardless.
    } finally {
        sessionStorage.removeItem(SESSION_KEY);
    }
}

/**
 * Return the cached session user, or null if not logged in.
 * Does NOT make a network request.
 */
export function getSessionUser(): SessionUser | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as SessionUser;
    } catch {
        return null;
    }
}

/**
 * True if a session user entry exists in sessionStorage.
 * Does not verify the session cookie with the server.
 */
export function isAuthenticated(): boolean {
    return getSessionUser() !== null;
}
