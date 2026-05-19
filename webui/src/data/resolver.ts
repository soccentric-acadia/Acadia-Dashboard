/**
 * src/data/resolver.ts
 *
 * The unified data resolver — picks live API or simulation engine
 * based on the current connection state.
 *
 * Pages call hooks from src/data/index.ts, which use this resolver.
 * Pages never know whether they're talking to the real server or the sim.
 */

import { useConnectionStore } from "@/state/connection";

export function useIsSimMode(): boolean {
    const state = useConnectionStore((s) => s.state);
    return state === "simulated";
}

export function useResolver() {
    const connectionState = useConnectionStore((s) => s.state);
    const isSimMode = connectionState === "simulated";
    return { isSimMode, connectionState };
}

/**
 * Higher-level helper: returns the correct value based on connection state.
 * Used in hooks to transparently switch between live and sim data sources.
 */
export function resolveData<TLive, TSim>(
    isSimMode: boolean,
    liveData: TLive,
    simData: TSim
): TLive | TSim {
    return isSimMode ? simData : liveData;
}
