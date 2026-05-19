/**
 * src/data/sim/profiles.ts
 *
 * Behavior profiles for the simulation engine.
 * Each profile modulates metric generation to produce different "health" states.
 */

export type SimProfile =
    | "healthy"
    | "thermal-throttling"
    | "memory-degraded"
    | "sensor-noisy"
    | "catastrophic";

export interface ProfileConfig {
    name: SimProfile;
    label: string;
    description: string;
    /** Base pass rate (0–1) */
    passRate: number;
    /** Noise multiplier for metric values */
    noiseFactor: number;
    /** Chance of a spike on any given metric tick (0–1) */
    spikeChance: number;
    /** Spike magnitude multiplier */
    spikeMagnitude: number;
    /** Severity bias: 0 = mostly INFO, 1 = mostly CRITICAL */
    severityBias: number;
    /** Per-category overrides */
    categoryOverrides?: Partial<Record<string, Partial<ProfileConfig>>>;
}

export const PROFILES: Record<SimProfile, ProfileConfig> = {
    "healthy": {
        name: "healthy",
        label: "Healthy",
        description: "All systems nominal. Pass rate ~98%, low noise.",
        passRate: 0.98,
        noiseFactor: 0.02,
        spikeChance: 0.005,
        spikeMagnitude: 1.5,
        severityBias: 0.05,
    },
    "thermal-throttling": {
        name: "thermal-throttling",
        label: "Thermal Throttling",
        description: "CPU/GPU thermals elevated. Compute tests may fail. High temps.",
        passRate: 0.80,
        noiseFactor: 0.08,
        spikeChance: 0.04,
        spikeMagnitude: 2.5,
        severityBias: 0.35,
        categoryOverrides: {
            compute: { passRate: 0.65, noiseFactor: 0.15, spikeChance: 0.08 },
            sensors: { passRate: 0.90, noiseFactor: 0.12 },
        },
    },
    "memory-degraded": {
        name: "memory-degraded",
        label: "Memory Degraded",
        description: "System memory showing errors. Storage tests may flap.",
        passRate: 0.75,
        noiseFactor: 0.10,
        spikeChance: 0.05,
        spikeMagnitude: 3.0,
        severityBias: 0.45,
        categoryOverrides: {
            compute: { passRate: 0.60, noiseFactor: 0.20 },
            storage: { passRate: 0.70, noiseFactor: 0.15 },
        },
    },
    "sensor-noisy": {
        name: "sensor-noisy",
        label: "Sensor Noisy",
        description: "Sensor readings are erratic. High variance on all sensor metrics.",
        passRate: 0.85,
        noiseFactor: 0.25,
        spikeChance: 0.10,
        spikeMagnitude: 4.0,
        severityBias: 0.25,
        categoryOverrides: {
            sensors: { passRate: 0.55, noiseFactor: 0.40, spikeChance: 0.20 },
        },
    },
    "catastrophic": {
        name: "catastrophic",
        label: "Catastrophic",
        description: "Multiple system failures. Expect widespread test failures.",
        passRate: 0.30,
        noiseFactor: 0.40,
        spikeChance: 0.25,
        spikeMagnitude: 6.0,
        severityBias: 0.80,
    },
};

export function getProfile(name: SimProfile): ProfileConfig {
    return PROFILES[name];
}

export function getProfileForCategory(profile: ProfileConfig, category: string): ProfileConfig {
    const override = profile.categoryOverrides?.[category];
    if (!override) return profile;
    return { ...profile, ...override };
}
