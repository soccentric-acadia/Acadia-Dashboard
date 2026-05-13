// TanStack Query hooks for all server state.

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
    fetchClients,
    fetchClient,
    fetchRun,
    fetchRuns,
    configureRun,
    startRun,
    stopRun,
    enableModule,
} from "./client";
import type { Client, Run, RunState } from "./types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const keys = {
    clients: ["clients"] as const,
    client: (id: string) => ["client", id] as const,
    runs: (filters?: Record<string, unknown>) => ["runs", filters ?? {}] as const,
    run: (id: string) => ["run", id] as const,
    health: ["health"] as const,
    modules: ["modules"] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export function useClients(options?: UseQueryOptions<Client[]>) {
    return useQuery({
        queryKey: keys.clients,
        queryFn: fetchClients,
        staleTime: 10_000,
        ...options,
    });
}

export function useClient(clientId: string, options?: UseQueryOptions<Client>) {
    return useQuery({
        queryKey: keys.client(clientId),
        queryFn: () => fetchClient(clientId),
        enabled: Boolean(clientId),
        staleTime: 10_000,
        ...options,
    });
}

export function useRuns(
    filters: { clientId?: string; moduleId?: string; state?: RunState; limit?: number; after?: string } = {}
) {
    return useQuery({
        queryKey: keys.runs(filters),
        queryFn: () => fetchRuns(filters),
        staleTime: 5_000,
    });
}

export function useRun(runId: string, options?: UseQueryOptions<Run>) {
    return useQuery({
        queryKey: keys.run(runId),
        queryFn: () => fetchRun(runId),
        enabled: Boolean(runId),
        staleTime: 3_000,
        ...options,
    });
}

export function useActiveRun(runId: string) {
    return useQuery({
        queryKey: keys.run(runId),
        queryFn: () => fetchRun(runId),
        enabled: Boolean(runId),
        refetchInterval: (query) => {
            const data = query.state.data;
            const state = (data as Run | undefined)?.state;
            return state === "running" || state === "configuring" || state === "ready" ? 2_000 : false;
        },
    });
}

export function useHealth() {
    return useQuery({
        queryKey: keys.health,
        queryFn: async () => {
            const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";
            const res = await fetch(`${base}/debug/state`);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            return res.json();
        },
        staleTime: 15_000,
        retry: false,
    });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useConfigureRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: configureRun,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.runs() });
        },
    });
}

export function useStartRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (runId: string) => startRun(runId),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: keys.run(data.runId) });
            qc.invalidateQueries({ queryKey: keys.runs() });
        },
    });
}

export function useStopRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (runId: string) => stopRun(runId),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: keys.run(data.runId) });
            qc.invalidateQueries({ queryKey: keys.runs() });
        },
    });
}

export function useEnableModule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, moduleId, enabled }: { clientId: string; moduleId: string; enabled: boolean }) =>
            enableModule(clientId, moduleId, enabled),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: keys.client(vars.clientId) });
        },
    });
}
