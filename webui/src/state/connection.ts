/**
 * src/state/connection.ts
 *
 * Zustand store for the four connection states.
 *
 * States: live | reconnecting | offline | simulated
 *
 * Transition rules:
 *  - App boots in "offline". First successful health check → "live".
 *  - "live" loses connection → "reconnecting" (30s exponential backoff).
 *  - "reconnecting" times out (30s) → "simulated" + toast.
 *  - Operator can manually toggle live ⇄ simulated at any time.
 *  - "simulated" → "live" on operator request (if server reachable).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ConnectionState = "live" | "reconnecting" | "offline" | "simulated";

interface ConnectionStore {
    state: ConnectionState;
    /** Timestamp when reconnecting started (ms) */
    reconnectingSince: number | null;
    /** Whether this session started in sim mode (user clicked "Continue in simulated mode") */
    isSimSession: boolean;
    /** Whether simulated data was generated but not synced */
    hasUnsyncedSimData: boolean;

    // Actions
    setLive: () => void;
    setReconnecting: () => void;
    setOffline: () => void;
    setSimulated: () => void;
    setSimSession: (val: boolean) => void;
    markUnsyncedSimData: () => void;
    clearUnsyncedSimData: () => void;
}

export const useConnectionStore = create<ConnectionStore>()(
    persist(
        (set) => ({
            state: "offline",
            reconnectingSince: null,
            isSimSession: false,
            hasUnsyncedSimData: false,

            setLive: () =>
                set({ state: "live", reconnectingSince: null }),

            setReconnecting: () =>
                set((s) => ({
                    state: "reconnecting",
                    reconnectingSince: s.reconnectingSince ?? Date.now(),
                })),

            setOffline: () =>
                set({ state: "offline", reconnectingSince: null }),

            setSimulated: () =>
                set({ state: "simulated", reconnectingSince: null }),

            setSimSession: (val) => set({ isSimSession: val }),
            markUnsyncedSimData: () => set({ hasUnsyncedSimData: true }),
            clearUnsyncedSimData: () => set({ hasUnsyncedSimData: false }),
        }),
        {
            name: "acadia-connection",
            partialize: (s) => ({
                // Only persist the "simSession" flag — live state is always re-derived
                isSimSession: s.isSimSession,
            }),
        }
    )
);

// ── Derived selector hooks ────────────────────────────────────────────────────

export function useConnectionState(): ConnectionState {
    return useConnectionStore((s) => s.state);
}

export function useIsSimulated(): boolean {
    return useConnectionStore((s) => s.state === "simulated");
}

export function useIsLive(): boolean {
    return useConnectionStore((s) => s.state === "live");
}
