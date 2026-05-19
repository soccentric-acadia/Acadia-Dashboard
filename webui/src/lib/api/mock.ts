/**
 * Offline fixture data — shown whenever the Acadia Server is unreachable.
 * All shapes must exactly match the types in ./types.ts and ./client.ts.
 * This file is NEVER imported by production code paths that mutate server state.
 */

import type { Board, Run, LogEntry, TestResult, PaginatedRuns, PaginatedResults } from "./types";
import type { ModuleInfo } from "./client";

// ── Board ─────────────────────────────────────────────────────────────────────

export const MOCK_BOARD: Board = {
    id: "brd-demo-0001",
    name: "Acadia Dev Board",
    hostname: "acadia-devboard-01",
    model: "Acadia IV&V Rev-C",
    status: "offline",
    first_seen: "2026-01-10T08:00:00Z",
    last_seen: new Date(Date.now() - 180_000).toISOString(),
    os_version: "Ubuntu 24.04 LTS",
    hal_version: "2.4.1",
    client_version: "0.1.0",
};

// ── Modules ───────────────────────────────────────────────────────────────────

export const MOCK_MODULES: ModuleInfo[] = [
    { id: "cpu", proto_package: "acadia.cpu", config_type: "CpuConfig", result_type: "CpuResult", version: "1.3.0", status: "available", source_path: "modules/cpu", category: "Processor" },
    { id: "gpu", proto_package: "acadia.gpu", config_type: "GpuConfig", result_type: "GpuResult", version: "1.1.2", status: "available", source_path: "modules/gpu", category: "Processor" },
    { id: "deep_learning_accelerator", proto_package: "acadia.dla", config_type: "DlaConfig", result_type: "DlaResult", version: "1.0.0", status: "available", source_path: "modules/dla", category: "Processor" },
    { id: "ethernet", proto_package: "acadia.eth", config_type: "EthConfig", result_type: "EthResult", version: "2.0.1", status: "available", source_path: "modules/ethernet", category: "Network" },
    { id: "ethernet_switch", proto_package: "acadia.ethsw", config_type: "EthSwConfig", result_type: "EthSwResult", version: "1.0.0", status: "available", source_path: "modules/ethsw", category: "Network" },
    { id: "communication_interface", proto_package: "acadia.comif", config_type: "ComIfConfig", result_type: "ComIfResult", version: "1.2.0", status: "available", source_path: "modules/comif", category: "Network" },
    { id: "imu", proto_package: "acadia.imu", config_type: "ImuConfig", result_type: "ImuResult", version: "1.4.0", status: "available", source_path: "modules/imu", category: "Sensors" },
    { id: "gnss", proto_package: "acadia.gnss", config_type: "GnssConfig", result_type: "GnssResult", version: "1.1.0", status: "available", source_path: "modules/gnss", category: "Sensors" },
    { id: "environmental", proto_package: "acadia.env", config_type: "EnvConfig", result_type: "EnvResult", version: "1.0.3", status: "available", source_path: "modules/env", category: "Sensors" },
    { id: "camera_interfaces", proto_package: "acadia.cam", config_type: "CamConfig", result_type: "CamResult", version: "2.1.0", status: "available", source_path: "modules/cam", category: "Camera" },
    { id: "camera_module3", proto_package: "acadia.cam3", config_type: "Cam3Config", result_type: "Cam3Result", version: "1.0.0", status: "available", source_path: "modules/cam3", category: "Camera" },
    { id: "display_interfaces", proto_package: "acadia.disp", config_type: "DispConfig", result_type: "DispResult", version: "1.2.0", status: "available", source_path: "modules/disp", category: "Display" },
    { id: "audio_interfaces", proto_package: "acadia.audio", config_type: "AudioConfig", result_type: "AudioResult", version: "1.1.0", status: "available", source_path: "modules/audio", category: "Audio" },
    { id: "gpio", proto_package: "acadia.gpio", config_type: "GpioConfig", result_type: "GpioResult", version: "1.0.2", status: "available", source_path: "modules/gpio", category: "Peripherals" },
    { id: "external_connector", proto_package: "acadia.ext", config_type: "ExtConfig", result_type: "ExtResult", version: "1.0.0", status: "available", source_path: "modules/ext", category: "Peripherals" },
    { id: "mcu_interface", proto_package: "acadia.mcu", config_type: "McuConfig", result_type: "McuResult", version: "1.3.1", status: "available", source_path: "modules/mcu", category: "Peripherals" },
    { id: "clock_and_timing", proto_package: "acadia.clk", config_type: "ClkConfig", result_type: "ClkResult", version: "1.0.0", status: "available", source_path: "modules/clk", category: "Timing" },
    { id: "functional_safety", proto_package: "acadia.fsafe", config_type: "FSafeConfig", result_type: "FSafeResult", version: "1.1.0", status: "available", source_path: "modules/fsafe", category: "Safety" },
    { id: "debug_and_development_interfaces", proto_package: "acadia.dbg", config_type: "DbgConfig", result_type: "DbgResult", version: "1.0.0", status: "available", source_path: "modules/dbg", category: "Debug" },
];

// ── Runs ──────────────────────────────────────────────────────────────────────

const now = Date.now();

export const MOCK_RUNS: Run[] = [
    {
        id: "run-demo-0001",
        name: "Nightly CPU Validation",
        description: "Full CPU + memory stress suite",
        mode: "long_term",
        status: "completed",
        baseline_flag: true,
        notes: "Baseline run for Rev-C board",
        error_message: "",
        created_at: new Date(now - 86_400_000 * 2).toISOString(),
        created_by: "admin",
        started_at: new Date(now - 86_400_000 * 2 + 60_000).toISOString(),
        ended_at: new Date(now - 86_400_000 * 2 + 3_600_000).toISOString(),
        tags: { env: "ci" },
    },
    {
        id: "run-demo-0002",
        name: "Ethernet Regression",
        description: "1G / 10G link tests",
        mode: "single_shot",
        status: "failed",
        baseline_flag: false,
        notes: "",
        error_message: "Packet loss exceeded 0.1% threshold on eth1",
        created_at: new Date(now - 86_400_000).toISOString(),
        created_by: "admin",
        started_at: new Date(now - 86_400_000 + 30_000).toISOString(),
        ended_at: new Date(now - 86_400_000 + 900_000).toISOString(),
        tags: {},
    },
    {
        id: "run-demo-0003",
        name: "Sensor Smoke Check",
        description: "IMU + GNSS + ENV quick sanity",
        mode: "single_shot",
        status: "completed",
        baseline_flag: false,
        notes: "",
        error_message: "",
        created_at: new Date(now - 7_200_000).toISOString(),
        created_by: "admin",
        started_at: new Date(now - 7_200_000 + 20_000).toISOString(),
        ended_at: new Date(now - 7_200_000 + 300_000).toISOString(),
        tags: { env: "dev" },
    },
    {
        id: "run-demo-0004",
        name: "OTA Validation — v2.4.1",
        description: "Post-upgrade HAL compatibility check",
        mode: "single_shot",
        status: "completed",
        baseline_flag: false,
        notes: "Triggered after OTA to v2.4.1",
        error_message: "",
        created_at: new Date(now - 3_600_000).toISOString(),
        created_by: "admin",
        started_at: new Date(now - 3_600_000 + 45_000).toISOString(),
        ended_at: new Date(now - 3_600_000 + 720_000).toISOString(),
        tags: { trigger: "ota" },
    },
    {
        id: "run-demo-0005",
        name: "Camera Interface Test",
        description: "CSI-2 / USB-C camera capture validation",
        mode: "single_shot",
        status: "queued",
        baseline_flag: false,
        notes: "",
        error_message: "",
        created_at: new Date(now - 60_000).toISOString(),
        created_by: "admin",
        started_at: null,
        ended_at: null,
        tags: {},
    },
];

// ── Paginated runs helpers ─────────────────────────────────────────────────────

export function mockRuns(filter: { status?: string; limit?: number; offset?: number } = {}): PaginatedRuns {
    let runs = MOCK_RUNS;
    if (filter.status) runs = runs.filter((r) => r.status === filter.status);
    const total = runs.length;
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 50;
    return { runs: runs.slice(offset, offset + limit), total };
}

// ── Test Results ──────────────────────────────────────────────────────────────

const BASE_RESULT_FIELDS = {
    run_id: "run-demo-0001",
    module_version: "1.3.0",
    mode: "single_shot" as const,
    reason: {},
    monitoring: {},
    event: {},
    subtests: [],
    payload_type_url: "",
    payload_b64: "",
};

export const MOCK_RESULTS: TestResult[] = [
    {
        ...BASE_RESULT_FIELDS,
        id: "res-001",
        module_id: "cpu",
        test_id: "cpu.load_avg",
        name: "CPU Load Average",
        sequence: 1,
        timestamp: new Date(now - 3_600_000).toISOString(),
        duration_ns: 1_200_000_000,
        status: "PASS",
        severity: "INFO",
        error_message: "",
        metrics: { load_avg_1m: { type: "double", value: 0.42 }, load_avg_5m: { type: "double", value: 0.38 } },
    },
    {
        ...BASE_RESULT_FIELDS,
        id: "res-002",
        module_id: "cpu",
        test_id: "cpu.temperature",
        name: "CPU Temperature",
        sequence: 2,
        timestamp: new Date(now - 3_598_000_000).toISOString(),
        duration_ns: 500_000_000,
        status: "PASS",
        severity: "INFO",
        error_message: "",
        metrics: { temp_celsius: { type: "double", value: 52.3 }, throttle_events: { type: "int", value: 0 } },
    },
    {
        ...BASE_RESULT_FIELDS,
        id: "res-003",
        module_id: "ethernet",
        test_id: "ethernet.packet_loss",
        name: "Ethernet Packet Loss",
        sequence: 3,
        timestamp: new Date(now - 3_596_000_000).toISOString(),
        duration_ns: 30_000_000_000,
        status: "FAIL",
        severity: "ERROR",
        error_message: "Packet loss 0.23% exceeds threshold of 0.10%",
        metrics: { loss_pct: { type: "double", value: 0.23 }, packets_sent: { type: "int", value: 100_000 } },
        reason: { threshold: "0.10%", measured: "0.23%", interface: "eth1" },
    },
    {
        ...BASE_RESULT_FIELDS,
        id: "res-004",
        module_id: "imu",
        test_id: "imu.calibration",
        name: "IMU Calibration Check",
        sequence: 4,
        timestamp: new Date(now - 3_594_000_000).toISOString(),
        duration_ns: 2_000_000_000,
        status: "PASS",
        severity: "INFO",
        error_message: "",
        metrics: { gyro_drift_dps: { type: "double", value: 0.002 }, accel_noise_mg: { type: "double", value: 0.8 } },
    },
    {
        ...BASE_RESULT_FIELDS,
        id: "res-005",
        module_id: "gnss",
        test_id: "gnss.fix_time",
        name: "GNSS Cold-Start Fix Time",
        sequence: 5,
        timestamp: new Date(now - 3_592_000_000).toISOString(),
        duration_ns: 45_000_000_000,
        status: "PASS",
        severity: "INFO",
        error_message: "",
        metrics: { fix_time_s: { type: "double", value: 28.7 }, satellites: { type: "int", value: 12 } },
    },
];

export const MOCK_PAGINATED_RESULTS: PaginatedResults = {
    results: MOCK_RESULTS,
    total: MOCK_RESULTS.length,
};

// ── Logs ──────────────────────────────────────────────────────────────────────

export const MOCK_LOGS: LogEntry[] = [
    { id: "log-001", run_id: null, source: "server", severity: "INFO", timestamp: new Date(now - 600_000).toISOString(), message: "Acadia Server started on :3000", metadata: null },
    { id: "log-002", run_id: null, source: "server", severity: "INFO", timestamp: new Date(now - 595_000).toISOString(), message: "Module registry loaded: 19 modules", metadata: null },
    { id: "log-003", run_id: "run-demo-0001", source: "runner", severity: "INFO", timestamp: new Date(now - 590_000).toISOString(), message: "Run run-demo-0001 queued", metadata: { run_id: "run-demo-0001" } },
    { id: "log-004", run_id: "run-demo-0001", source: "runner", severity: "INFO", timestamp: new Date(now - 585_000).toISOString(), message: "Run run-demo-0001 started", metadata: { run_id: "run-demo-0001" } },
    { id: "log-005", run_id: "run-demo-0001", source: "cpu", severity: "INFO", timestamp: new Date(now - 580_000).toISOString(), message: "cpu.load_avg: PASS (0.42)", metadata: null },
    { id: "log-006", run_id: "run-demo-0001", source: "ethernet", severity: "WARNING", timestamp: new Date(now - 575_000).toISOString(), message: "ethernet.packet_loss: approaching threshold on eth1", metadata: null },
    { id: "log-007", run_id: "run-demo-0001", source: "ethernet", severity: "ERROR", timestamp: new Date(now - 570_000).toISOString(), message: "ethernet.packet_loss: FAIL — 0.23% loss (threshold 0.10%)", metadata: { measured: "0.23%", threshold: "0.10%" } },
    { id: "log-008", run_id: "run-demo-0001", source: "runner", severity: "INFO", timestamp: new Date(now - 565_000).toISOString(), message: "Run run-demo-0001 completed with status: failed", metadata: null },
    { id: "log-009", run_id: null, source: "server", severity: "INFO", timestamp: new Date(now - 300_000).toISOString(), message: "Health-check requested by 127.0.0.1", metadata: null },
    { id: "log-010", run_id: null, source: "server", severity: "WARNING", timestamp: new Date(now - 120_000).toISOString(), message: "Client disconnected before response completed", metadata: null },
];
