/**
 * src/data/sim/generators/index.ts
 *
 * Per-mode result generators for the simulation engine.
 * Produces realistic TestResult objects for any module.
 */

import type { TestResult } from "@/proto/types";
import { getModule } from "@/proto/types";
import type { ProfileConfig } from "../profiles";
import type { Duration } from "@/proto/generated/google/protobuf/duration";

/** Convert milliseconds to a proto Duration object */
function msToDuration(ms: number): Duration {
    const seconds = Math.floor(ms / 1000);
    const nanos = (ms % 1000) * 1_000_000;
    return { seconds, nanos };
}
import { getProfileForCategory } from "../profiles";
import { randFloat, randInt, randBool } from "../rng";

// ── Realistic metric ranges ───────────────────────────────────────────────────

const METRIC_RANGES: Record<string, [number, number]> = {
    cpu_load_pct: [5, 95],
    cpu_freq_mhz: [600, 1800],
    cpu_temp_celsius: [35, 85],
    cache_miss_rate: [0.001, 0.05],
    context_switches: [1000, 50000],
    gpu_load_pct: [0, 100],
    gpu_freq_mhz: [200, 1000],
    gpu_temp_celsius: [30, 90],
    bandwidth_gbps: [0.5, 50],
    latency_ns: [50, 5000],
    latency_us: [10, 5000],
    latency_ms: [0.5, 50],
    error_count: [0, 10],
    temp_celsius: [20, 80],
    throttle_events: [0, 20],
    voltage_mv: [3000, 5000],
    current_ma: [50, 2000],
    soc_pct: [5, 100],
    throughput_mbps: [10, 1000],
    packet_loss_pct: [0, 5],
    error_rate: [0, 0.1],
    read_mbps: [50, 3500],
    write_mbps: [20, 3000],
    iops: [1000, 500000],
    satellites_visible: [4, 20],
    hdop: [0.5, 5.0],
    fix_time_s: [1, 60],
    accuracy_m: [0.5, 10],
    accel_x: [-20, 20],
    accel_y: [-20, 20],
    accel_z: [0, 30],
    gyro_x: [-500, 500],
    gyro_y: [-500, 500],
    gyro_z: [-500, 500],
    humidity_pct: [20, 95],
    pressure_hpa: [980, 1030],
    rssi_dbm: [-100, -30],
    throughput_kbps: [10, 3000],
    snr_db: [10, 50],
    thd_pct: [0.001, 1],
    fps: [1, 120],
    inference_fps: [1, 1000],
    power_mw: [100, 15000],
    utilization_pct: [0, 100],
    bit_rate_gbps: [0.5, 40],
    link_speed_gbps: [0.5, 32],
    link_width: [1, 16],
    drift_ppm: [-10, 10],
    offset_ms: [-5, 5],
    jitter_ps: [1, 1000],
    default_value: [0, 100],
};

function getRange(key: string): [number, number] {
    return METRIC_RANGES[key] ?? METRIC_RANGES.default_value;
}

// ── Status generation ─────────────────────────────────────────────────────────

function generateStatus(profile: ProfileConfig): "PASS" | "FAIL" | "ERROR" | "TIMEOUT" | "SKIPPED" | "ABORTED" {
    const r = Math.random();
    if (r < profile.passRate) return "PASS";
    const failTypes = ["FAIL", "ERROR", "TIMEOUT", "SKIPPED", "ABORTED"] as const;
    // Weight: FAIL > ERROR > TIMEOUT > SKIPPED > ABORTED
    const weights = [0.5, 0.25, 0.15, 0.07, 0.03];
    let cum = 0;
    const p = Math.random();
    for (let i = 0; i < failTypes.length; i++) {
        cum += weights[i];
        if (p < cum) return failTypes[i];
    }
    return "FAIL";
}

function generateSeverity(status: string, profile: ProfileConfig): "INFO" | "WARNING" | "ERROR" | "CRITICAL" {
    if (status === "PASS") {
        return randBool(0.05) ? "WARNING" : "INFO";
    }
    const r = Math.random();
    if (r < profile.severityBias * 0.5) return "CRITICAL";
    if (r < profile.severityBias) return "ERROR";
    return "WARNING";
}

// ── Metric generation ─────────────────────────────────────────────────────────

function generateMetrics(
    metricKeys: string[],
    profile: ProfileConfig,
    status: string
): Record<string, { doubleValue?: number; intValue?: number; boolValue?: boolean; stringValue?: string }> {
    const out: Record<string, { doubleValue?: number }> = {};
    for (const key of metricKeys) {
        const [min, max] = getRange(key);
        let value = randFloat(min, max);

        // Add noise
        value += (Math.random() - 0.5) * (max - min) * profile.noiseFactor;

        // Spike
        if (randBool(profile.spikeChance)) {
            value *= profile.spikeMagnitude;
        }

        // If test failed, bias toward bad values (high temp, high error count, etc.)
        if (status !== "PASS" && key.includes("error")) {
            value = randFloat(max * 0.5, max * 2);
        }
        if (status !== "PASS" && key.includes("temp")) {
            value = randFloat(max * 0.8, max * 1.1);
        }

        // Clamp to reasonable range
        value = Math.max(min * 0.5, Math.min(max * 1.5, value));

        out[key] = { doubleValue: parseFloat(value.toFixed(3)) };
    }
    return out;
}

// ── Single-shot result generator ──────────────────────────────────────────────

export function generateSingleShotResult(
    moduleId: string,
    sequence: number,
    profile: ProfileConfig
): TestResult {
    const mod = getModule(moduleId);
    if (!mod) throw new Error(`Unknown module: ${moduleId}`);

    const effectiveProfile = getProfileForCategory(profile, mod.category);
    const status = generateStatus(effectiveProfile);
    const severity = generateSeverity(status, effectiveProfile);
    const metrics = generateMetrics(mod.observableMetricKeys, effectiveProfile, status);

    const testIds = [`${moduleId}_smoke`, `${moduleId}_basic`, `${moduleId}_stress`];
    const numSubtests = randInt(1, Math.min(5, testIds.length));

    const subtests: TestResult[] = Array.from({ length: numSubtests }, (_, i) => {
        const subStatus = generateStatus(effectiveProfile);
        const subMetrics = generateMetrics(mod.observableMetricKeys.slice(0, 2), effectiveProfile, subStatus);
        return {
            moduleId,
            testId: `${moduleId}_subtest_${i}`,
            name: `${mod.displayName} Sub-test ${i + 1}`,
            sequence: i,
            timestamp: new Date(Date.now() - randInt(100, 5000)),
            duration: msToDuration(randInt(10, 2000)),
            output: {
                status: subStatus as never,
                severity: generateSeverity(subStatus, effectiveProfile) as never,
                reason: subStatus !== "PASS" ? { [subStatus.toLowerCase()]: "Simulated failure" } : {},
                metrics: subMetrics,
                monitoring: {},
                event: {},
                errorMessage: subStatus === "ERROR" ? "Simulated error condition" : "",
            },
            subtests: [],
        };
    });

    return {
        moduleId,
        testId: `${moduleId}_main`,
        name: mod.displayName,
        sequence,
        timestamp: new Date(),
        duration: msToDuration(randInt(50, 5000)),
        output: {
            status: status as never,
            severity: severity as never,
            reason: status !== "PASS" ? { [status.toLowerCase()]: "Simulated failure condition" } : {},
            metrics,
            monitoring: generateMetrics(mod.monitoringKeys, effectiveProfile, status),
            event: {},
            errorMessage: status === "ERROR" ? "Simulated error — no real hardware" : "",
        },
        subtests,
    };
}

// ── Streaming result generator (long-term / monitoring) ───────────────────────

/** Generates a result appropriate for a streaming/incremental tick */
export function generateStreamingResult(
    moduleId: string,
    sequence: number,
    profile: ProfileConfig
): TestResult {
    // For streaming, generate slightly correlated values (drift from previous)
    return generateSingleShotResult(moduleId, sequence, profile);
}

export function generateEventResult(
    moduleId: string,
    sequence: number,
    profile: ProfileConfig
): TestResult {
    const mod = getModule(moduleId);
    if (!mod) throw new Error(`Unknown module: ${moduleId}`);
    const effectiveProfile = getProfileForCategory(profile, mod.category);
    const eventKeys = mod.eventKeys.length ? mod.eventKeys : mod.observableMetricKeys.slice(0, 2);
    const metrics = generateMetrics(eventKeys, effectiveProfile, "PASS");

    return {
        moduleId,
        testId: `${moduleId}_event`,
        name: `${mod.displayName} Event`,
        sequence,
        timestamp: new Date(),
        duration: msToDuration(randInt(1, 100)),
        output: {
            status: "PASS" as never,
            severity: "INFO" as never,
            reason: {},
            metrics,
            monitoring: {},
            event: generateMetrics(eventKeys, effectiveProfile, "PASS"),
            errorMessage: "",
        },
        subtests: [],
    };
}
