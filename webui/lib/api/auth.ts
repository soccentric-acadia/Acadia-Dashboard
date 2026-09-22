// lib/api/auth.ts — client-side auth state + login/logout flows (DSH-003).
//
// The Dashboard talks to the Acadia Server's REST API, which (since SRV-001)
// authenticates every route except login/health. Two auth mechanisms are
// supported by the Server:
//   1. the Drogon session cookie (set by POST /api/v1/auth/login; fetches must
//      use credentials: "include"), and
//   2. Bearer API tokens (Authorization header).
// This module tracks the logged-in user client-side (localStorage), performs
// the login/logout calls, and exposes the 401-recovery hook used by fetchJson.

import { apiUrl } from "./client";

const USER_KEY = "acadia.auth.user";

export interface AuthUser {
    user_id: string;
    username: string;
}

export function getAuthUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

export function setAuthUser(user: AuthUser): void {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthUser(): void {
    window.localStorage.removeItem(USER_KEY);
}

/** POST /api/v1/auth/login — sets the Server session cookie and returns the user. */
export async function login(username: string, password: string): Promise<AuthUser> {
    const response = await fetch(apiUrl("/api/v1/auth/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        cache: "no-store",
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Login failed (${response.status})`);
    }
    const user = (await response.json()) as AuthUser;
    setAuthUser(user);
    return user;
}

/** POST /api/v1/auth/logout — clears the Server session and local state. */
export async function logout(): Promise<void> {
    try {
        await fetch(apiUrl("/api/v1/auth/logout"), {
            method: "POST",
            credentials: "include",
            cache: "no-store",
        });
    } finally {
        clearAuthUser();
    }
}

/**
 * Invoked by the API client when the Server answers 401: the session has
 * expired. Clears local state and sends the operator to the login page.
 */
export function handleUnauthorized(): void {
    clearAuthUser();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
    }
}