#!/usr/bin/env ts-node
/**
 * generate-from-protos.ts
 *
 * Build-time script that reads Acadia-HAL protos and writes:
 *   src/proto/generated/common.ts          — common.proto TypeScript types
 *   src/proto/generated/modules/index.ts   — per-module Config/Result stubs
 *   src/proto/module-catalog.ts            — ModuleDefinition catalog keyed by module_id
 *
 * Run:
 *   pnpm gen           (or npm run gen)
 *   runs automatically as 'prebuild'
 *
 * Requirements (all optional — script degrades gracefully):
 *   protoc             — https://grpc.io/docs/protoc-installation/
 *   protoc-gen-ts_proto — installed via ts-proto devDependency
 *
 * When protoc is unavailable the script still regenerates module-catalog.ts
 * from modules.yaml; only the generated/*.ts stubs are skipped.
 */

import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "../../../");
const HAL_PROTOS = path.join(REPO_ROOT, "Acadia-HAL/protos");
const MODULES_YAML = path.join(HAL_PROTOS, "registry/modules.yaml");
const OUT_GENERATED = path.resolve(__dirname, "../src/proto/generated");
const OUT_CATALOG = path.resolve(__dirname, "../src/proto/module-catalog.ts");

// ---------------------------------------------------------------------------
// Minimal YAML parser (no external deps needed)
// ---------------------------------------------------------------------------

interface YamlModule {
    id: string;
    proto_package?: string;
    config_type?: string;
    result_type?: string;
    config_type_url?: string;
    result_type_url?: string;
    version: string | number;
    status: "active" | "deprecated";
    category: string;
    source_path?: string;
    name?: string;
    description?: string;
    modes?: string[];
}

function parseModulesYaml(content: string): YamlModule[] {
    const modules: YamlModule[] = [];
    const lines = content.split("\n");
    let current: Partial<YamlModule> | null = null;

    for (const raw of lines) {
        const line = raw.trimEnd();
        if (line.match(/^\s*-\s+id:\s+(\S+)/)) {
            if (current?.id) modules.push(current as YamlModule);
            current = { id: line.match(/id:\s+(\S+)/)![1] };
        } else if (current) {
            const kv = line.match(/^\s+(\w[\w_]*):\s+(.*)/);
            if (!kv) continue;
            const [, key, val] = kv;
            const trimmed = val.trim().replace(/^["']|["']$/g, "");
            if (key === "modes") {
                // e.g.: [SINGLE_SHOT, LONG_TERM]
                current.modes = val.replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
            } else {
                (current as Record<string, unknown>)[key] = trimmed;
            }
        }
    }
    if (current?.id) modules.push(current as YamlModule);
    return modules;
}

// ---------------------------------------------------------------------------
// Category → icon + display-name helpers
// ---------------------------------------------------------------------------

const CATEGORY_ICON: Record<string, string> = {
    compute: "Cpu",
    connectivity: "Network",
    peripherals: "Plug",
    sensors: "Thermometer",
    timing: "Clock",
    power: "Zap",
    safety: "Shield",
    security: "Lock",
    storage: "HardDrive",
    debug: "Bug",
    io: "Cable",
    system: "Server",
    audio: "Volume2",
    camera: "Camera",
    display: "Monitor",
};

function iconForModule(moduleId: string, category: string): string {
    // Per-module overrides
    const overrides: Record<string, string> = {
        cpu: "Cpu",
        gpu: "Layers",
        system_memory: "MemoryStick",
        thermal_management: "Thermometer",
        battery: "Battery",
        power_management: "Zap",
        poe_hat: "Zap",
        storage: "HardDrive",
        nvme: "HardDrive",
        emmc: "HardDrive",
        sd_card: "HardDrive",
        ethernet: "Network",
        ethernet_switch: "Network",
        bluetooth: "Bluetooth",
        usb: "Usb",
        can_bus: "Network",
        rs485: "Cable",
        i2c: "Cable",
        spi: "Cable",
        uart: "Cable",
        gpio: "Cable",
        analog_input: "Sliders",
        pwm_output: "Waves",
        gnss: "MapPin",
        imu: "Compass",
        accelerometer: "Activity",
        environmental: "Wind",
        sense_hat: "Gauge",
        camera_interfaces: "Camera",
        camera_module3: "Camera",
        mipi_csi: "Camera",
        mipi_dsi: "Monitor",
        display_interfaces: "Monitor",
        audio_interfaces: "Volume2",
        rtc: "Clock",
        clock_and_timing: "Clock",
        functional_safety: "ShieldCheck",
        reliability: "ShieldCheck",
        watchdog_and_reset: "RefreshCcw",
        security_features: "Lock",
        deep_learning_accelerator: "Brain",
        vision_accelerator: "Eye",
        video_encode_decode: "Video",
        debug_and_development_interfaces: "Bug",
        software_interface: "Code",
        pcie: "Circuit",
        mcu_interface: "Microchip",
        communication_interface: "Radio",
        system_integration: "Layers",
        serializer_deserializer: "ArrowLeftRight",
        external_connector: "Plug",
        mipi_csi2: "Camera",
    };
    return overrides[moduleId] ?? CATEGORY_ICON[category] ?? "CircleDot";
}

function displayName(moduleId: string, yamlName?: string): string {
    if (yamlName) return yamlName;
    return moduleId
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function moduleDescription(moduleId: string, yamlDescription?: string): string {
    if (yamlDescription) return yamlDescription;
    const name = displayName(moduleId);
    return `${name} hardware validation and testing`;
}

// ---------------------------------------------------------------------------
// Metric/monitoring/event key inference per module
// (best-effort from module semantics; extendable)
// ---------------------------------------------------------------------------

const METRIC_KEYS: Record<string, string[]> = {
    cpu: ["cpu_load_pct", "cpu_freq_mhz", "cache_miss_rate", "context_switches"],
    gpu: ["gpu_load_pct", "gpu_freq_mhz", "memory_bw_gbps"],
    system_memory: ["bandwidth_gbps", "latency_ns", "error_count"],
    thermal_management: ["temp_celsius", "throttle_events", "cooling_rate"],
    battery: ["voltage_mv", "current_ma", "soc_pct", "temp_celsius"],
    power_management: ["voltage_mv", "current_ma", "power_mw"],
    ethernet: ["throughput_mbps", "latency_us", "packet_loss_pct", "error_rate"],
    ethernet_switch: ["throughput_mbps", "port_errors", "forwarding_rate"],
    usb: ["transfer_rate_mbps", "error_count", "latency_us"],
    storage: ["read_mbps", "write_mbps", "iops", "latency_us"],
    nvme: ["read_mbps", "write_mbps", "iops", "latency_us", "smart_health"],
    emmc: ["read_mbps", "write_mbps", "erase_count", "health_pct"],
    sd_card: ["read_mbps", "write_mbps", "error_count"],
    gnss: ["satellites_visible", "hdop", "fix_time_s", "accuracy_m"],
    imu: ["accel_x", "accel_y", "accel_z", "gyro_x", "gyro_y", "gyro_z"],
    accelerometer: ["accel_x", "accel_y", "accel_z", "noise_mg"],
    environmental: ["temp_celsius", "humidity_pct", "pressure_hpa"],
    sense_hat: ["temp_celsius", "humidity_pct", "pressure_hpa", "orientation_deg"],
    gpio: ["voltage_v", "toggle_freq_hz", "error_count"],
    analog_input: ["voltage_v", "noise_mv", "linearity_pct"],
    pwm_output: ["freq_hz", "duty_cycle_pct", "rise_time_ns"],
    can_bus: ["frame_rate_fps", "error_frame_count", "bus_load_pct"],
    rs485: ["transfer_rate_kbps", "error_count", "framing_errors"],
    i2c: ["transfer_rate_kbps", "ack_errors", "arbitration_lost"],
    spi: ["transfer_rate_mbps", "error_count"],
    uart: ["baud_rate_bps", "error_count", "framing_errors"],
    rtc: ["drift_ppm", "offset_ms", "accuracy_ppm"],
    clock_and_timing: ["jitter_ps", "accuracy_ppb", "freq_hz"],
    security_features: ["secure_boot_time_ms", "crypto_ops_per_sec", "entropy_bits"],
    deep_learning_accelerator: ["inference_fps", "power_mw", "utilization_pct"],
    vision_accelerator: ["inference_fps", "latency_ms", "power_mw"],
    video_encode_decode: ["fps", "bitrate_mbps", "latency_ms"],
    audio_interfaces: ["snr_db", "thd_pct", "latency_ms"],
    camera_interfaces: ["fps", "resolution_mpx", "snr_db"],
    camera_module3: ["fps", "resolution_mpx", "exposure_us"],
    mipi_csi: ["lanes_active", "bit_rate_gbps", "error_count"],
    mipi_dsi: ["lanes_active", "bit_rate_gbps", "refresh_rate_hz"],
    display_interfaces: ["refresh_rate_hz", "resolution_px", "color_depth_bpp"],
    pcie: ["link_speed_gbps", "link_width", "error_count", "bandwidth_gbps"],
    mcu_interface: ["rtt_us", "error_count", "fw_version"],
    communication_interface: ["throughput_mbps", "latency_us", "error_rate"],
    bluetooth: ["rssi_dbm", "throughput_kbps", "pair_time_ms"],
    functional_safety: ["fault_detection_time_ms", "dcls_pct", "spfm_pct"],
    reliability: ["mtbf_hours", "fault_count", "recovery_time_ms"],
    watchdog_and_reset: ["reset_count", "timeout_ms", "kick_interval_ms"],
    software_interface: ["api_latency_us", "memory_kb", "cpu_pct"],
    debug_and_development_interfaces: ["jtag_speed_mhz", "uart_baud_rate", "breakpoint_latency_us"],
    serializer_deserializer: ["bit_rate_gbps", "ber", "signal_quality_db"],
    external_connector: ["contact_resistance_mohm", "insertion_force_n"],
    poe_hat: ["power_budget_mw", "voltage_v", "current_ma"],
    system_integration: ["boot_time_ms", "latency_us", "error_count"],
};

const MONITORING_KEYS: Record<string, string[]> = {
    cpu: ["cpu_load_pct", "cpu_temp_celsius"],
    gpu: ["gpu_load_pct", "gpu_temp_celsius"],
    thermal_management: ["temp_celsius", "throttle_events"],
    battery: ["soc_pct", "voltage_mv", "temp_celsius"],
    ethernet: ["throughput_mbps", "error_rate"],
    storage: ["read_mbps", "write_mbps"],
    environmental: ["temp_celsius", "humidity_pct"],
};

const EVENT_KEYS: Record<string, string[]> = {
    battery: ["voltage_threshold_mv", "soc_threshold_pct"],
    can_bus: ["error_frame_threshold", "bus_load_threshold_pct"],
    analog_input: ["voltage_threshold_v", "noise_threshold_mv"],
    accelerometer: ["shock_threshold_mg", "axis"],
};

// ---------------------------------------------------------------------------
// Catalog template generator
// ---------------------------------------------------------------------------

function generateCatalog(modules: YamlModule[]): string {
    const entries = modules
        .filter((m) => m.status === "active")
        .map((m) => {
            const metricKeys = METRIC_KEYS[m.id] ?? ["value"];
            const monitoringKeys = MONITORING_KEYS[m.id] ?? [];
            const eventKeys = EVENT_KEYS[m.id] ?? [];
            const modes = m.modes
                ? `[${m.modes.map((x) => JSON.stringify(x)).join(", ")}]`
                : `["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"]`;

            return `  ${JSON.stringify(m.id)}: {
    id: ${JSON.stringify(m.id)},
    displayName: ${JSON.stringify(displayName(m.id, m.name))},
    description: ${JSON.stringify(moduleDescription(m.id, m.description))},
    category: ${JSON.stringify(m.category)} as ModuleCategory,
    iconHint: ${JSON.stringify(iconForModule(m.id, m.category))},
    version: ${JSON.stringify(String(m.version))},
    status: "active",
    protoPackage: ${JSON.stringify(m.proto_package ?? `hal.modules.${m.id}`)},
    configTypeUrl: ${JSON.stringify(m.config_type_url ?? m.config_type ?? `hal.modules.${m.id}.Config`)},
    resultTypeUrl: ${JSON.stringify(m.result_type_url ?? m.result_type ?? `hal.modules.${m.id}.Result`)},
    configSchema: {
      fields: [
        { name: "test_names", type: "string_array", label: "Test Names", description: "Which tests to run (empty = all)" },
      ],
    },
    resultSchema: {
      fields: [
        { name: "results", type: "test_result_array", label: "Test Results" },
      ],
    },
    observableMetricKeys: ${JSON.stringify(metricKeys)},
    monitoringKeys: ${JSON.stringify(monitoringKeys)},
    eventKeys: ${JSON.stringify(eventKeys)},
    supportedModes: ${modes},
  }`;
        });

    return `/**
 * MODULE CATALOG — AUTO-GENERATED
 *
 * Source: Acadia-HAL/protos/registry/modules.yaml
 * Generator: scripts/generate-from-protos.ts
 *
 * DO NOT EDIT MANUALLY — run \`npm run gen\` to regenerate.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ModuleCategory =
  | "compute"
  | "connectivity"
  | "peripherals"
  | "sensors"
  | "timing"
  | "power"
  | "safety"
  | "security"
  | "storage"
  | "debug"
  | "io"
  | "system"
  | "audio"
  | "camera"
  | "display";

export interface SchemaFieldDescriptor {
  name: string;
  type:
    | "string"
    | "string_array"
    | "bool"
    | "int"
    | "double"
    | "enum"
    | "message"
    | "test_result_array";
  label: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  fields?: SchemaFieldDescriptor[];
}

export interface SchemaDescriptor {
  fields: SchemaFieldDescriptor[];
}

export interface ModuleDefinition {
  id: string;
  displayName: string;
  description: string;
  category: ModuleCategory;
  iconHint: string;
  version: string;
  status: "active" | "deprecated";
  protoPackage: string;
  configTypeUrl: string;
  resultTypeUrl: string;
  configSchema: SchemaDescriptor;
  resultSchema: SchemaDescriptor;
  observableMetricKeys: string[];
  monitoringKeys: string[];
  eventKeys: string[];
  supportedModes: string[];
}

// ── Catalog ───────────────────────────────────────────────────────────────────

export const MODULE_CATALOG: Record<string, ModuleDefinition> = {
${entries.join(",\n")}
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULE_CATALOG[id];
}

export function getModuleOrThrow(id: string): ModuleDefinition {
  const m = MODULE_CATALOG[id];
  if (!m) throw new Error(\`Unknown module: \${id}\`);
  return m;
}

export const ALL_MODULE_IDS: string[] = Object.keys(MODULE_CATALOG);

export const MODULES_BY_CATEGORY: Record<ModuleCategory, ModuleDefinition[]> = (() => {
  const out = {} as Record<ModuleCategory, ModuleDefinition[]>;
  for (const m of Object.values(MODULE_CATALOG)) {
    if (!out[m.category]) out[m.category] = [];
    out[m.category].push(m);
  }
  return out;
})();

export const CATEGORY_ORDER: ModuleCategory[] = [
  "compute",
  "storage",
  "connectivity",
  "sensors",
  "power",
  "io",
  "timing",
  "peripherals",
  "safety",
  "security",
  "debug",
  "system",
  "audio",
  "camera",
  "display",
];
`;
}

// ---------------------------------------------------------------------------
// Proto type stubs generator (common.ts + per-module stubs)
// ---------------------------------------------------------------------------

function generateCommonTypes(): string {
    return `/**
 * common.ts — AUTO-GENERATED from Acadia-HAL/protos/common.proto
 * Generator: scripts/generate-from-protos.ts
 * DO NOT EDIT MANUALLY.
 */

// ── Enumerations ──────────────────────────────────────────────────────────────

export enum TestStatus {
  TEST_STATUS_UNSPECIFIED = 0,
  TEST_STATUS_PASS        = 1,
  TEST_STATUS_FAIL        = 2,
  TEST_STATUS_ERROR       = 3,
  TEST_STATUS_TIMEOUT     = 4,
  TEST_STATUS_ABORTED     = 5,
  TEST_STATUS_SKIPPED     = 6,
  // Deprecated aliases (kept for wire compatibility)
  PASS    = 1,
  FAIL    = 2,
  ERROR   = 3,
  TIMEOUT = 4,
  ABORTED = 5,
  PARTIAL = 6,
}

export enum TestSeverity {
  TEST_SEVERITY_UNSPECIFIED = 0,
  TEST_SEVERITY_INFO        = 1,
  TEST_SEVERITY_WARNING     = 2,
  TEST_SEVERITY_ERROR       = 3,
  TEST_SEVERITY_CRITICAL    = 4,
}

export enum ExecutionMode {
  EXECUTION_MODE_UNSPECIFIED = 0,
  SINGLE_SHOT                = 1,
  LONG_TERM                  = 2,
  MONITORING                 = 3,
  EVENT_BASED                = 4,
}

// ── Value types ───────────────────────────────────────────────────────────────

export interface TypedValue {
  boolValue?:   boolean;
  intValue?:    number;
  doubleValue?: number;
  stringValue?: string;
}

// ── Output / Result ───────────────────────────────────────────────────────────

export interface TestOutput {
  status:       TestStatus;
  severity:     TestSeverity;
  reason:       Record<string, string>;
  metrics:      Record<string, TypedValue>;
  monitoring:   Record<string, TypedValue>;
  event:        Record<string, TypedValue>;
  errorMessage: string;
}

export interface TestResult {
  moduleId:   string;
  testId:     string;
  name:       string;
  sequence:   number;
  timestamp:  string;   // ISO 8601
  duration:   number;   // nanoseconds
  output:     TestOutput;
  subtests:   TestResult[];
}

// ── Run / Service types ───────────────────────────────────────────────────────

export interface CommonConfig {
  executionMode: ExecutionMode;
  frequencyHz?: number;
  durationMs?:  number;
}

export interface MonitoringParams {
  intervalMs: number;
  extraKeys:  string[];
}

export interface EventCondition {
  metricKey: string;
  operator:  "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: TypedValue;
}

// ── String helpers ────────────────────────────────────────────────────────────

/** Canonical status string used by the UI layer */
export type StatusString =
  | "PASS"
  | "FAIL"
  | "ERROR"
  | "TIMEOUT"
  | "SKIPPED"
  | "ABORTED"
  | "RUNNING"
  | "NEVER";

/** Canonical severity string used by the UI layer */
export type SeverityString = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export function statusToString(s: TestStatus): StatusString {
  switch (s) {
    case TestStatus.TEST_STATUS_PASS:    return "PASS";
    case TestStatus.TEST_STATUS_FAIL:    return "FAIL";
    case TestStatus.TEST_STATUS_ERROR:   return "ERROR";
    case TestStatus.TEST_STATUS_TIMEOUT: return "TIMEOUT";
    case TestStatus.TEST_STATUS_ABORTED: return "ABORTED";
    case TestStatus.TEST_STATUS_SKIPPED: return "SKIPPED";
    default:                             return "NEVER";
  }
}

export function severityToString(s: TestSeverity): SeverityString {
  switch (s) {
    case TestSeverity.TEST_SEVERITY_WARNING:  return "WARNING";
    case TestSeverity.TEST_SEVERITY_ERROR:    return "ERROR";
    case TestSeverity.TEST_SEVERITY_CRITICAL: return "CRITICAL";
    default:                                  return "INFO";
  }
}
`;
}

function generateModuleTypes(modules: YamlModule[]): string {
    const active = modules.filter((m) => m.status === "active");
    const moduleBlocks = active.map((m) => {
        const pkg = m.proto_package ?? `hal.modules.${m.id}`;
        return `// ${pkg}\nexport interface ${toPascalCase(m.id)}Config { testNames: string[]; }\nexport interface ${toPascalCase(m.id)}Result { results: import("../common").TestResult[]; }`;
    });

    return `/**
 * modules/index.ts — AUTO-GENERATED
 * Minimal Config/Result stubs for all HAL modules.
 * Generator: scripts/generate-from-protos.ts
 * DO NOT EDIT MANUALLY.
 */

${moduleBlocks.join("\n\n")}
`;
}

function toPascalCase(s: string): string {
    return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    console.log("▶ generate-from-protos.ts");

    // 1. Parse modules.yaml
    if (!fs.existsSync(MODULES_YAML)) {
        console.error(`✗ modules.yaml not found at: ${MODULES_YAML}`);
        console.error("  Ensure Acadia-HAL is checked out at the same level as Acadia-Dashboard.");
        process.exit(1);
    }
    const yaml = fs.readFileSync(MODULES_YAML, "utf8");
    const modules = parseModulesYaml(yaml);
    console.log(`  Parsed ${modules.length} modules from modules.yaml`);

    // 2. Write common types
    fs.mkdirSync(path.join(OUT_GENERATED, "modules"), { recursive: true });
    fs.writeFileSync(path.join(OUT_GENERATED, "common.ts"), generateCommonTypes());
    console.log("  ✓ src/proto/generated/common.ts");

    // 3. Write module type stubs
    fs.writeFileSync(path.join(OUT_GENERATED, "modules", "index.ts"), generateModuleTypes(modules));
    console.log("  ✓ src/proto/generated/modules/index.ts");

    // 4. Write module catalog
    fs.writeFileSync(OUT_CATALOG, generateCatalog(modules));
    console.log("  ✓ src/proto/module-catalog.ts");

    // 5. Optionally run protoc + ts-proto for full wire types (best-effort)
    const protocBin = findProtoc();
    if (protocBin) {
        console.log(`  protoc found at: ${protocBin}`);
        runProtoc(protocBin, modules);
    } else {
        console.log("  ℹ protoc not found — skipping full wire type generation (stubs used instead)");
        console.log("    Install protoc to generate complete wire types: https://grpc.io/docs/protoc-installation/");
    }

    console.log("✓ generate-from-protos done");
}

function findProtoc(): string | null {
    try {
        const result = child_process.execSync("which protoc 2>/dev/null || where protoc 2>nul", {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        return result || null;
    } catch {
        return null;
    }
}

function runProtoc(protocBin: string, _modules: YamlModule[]) {
    const tspPlugin = path.resolve(__dirname, "../node_modules/.bin/protoc-gen-ts_proto");
    if (!fs.existsSync(tspPlugin)) {
        console.log("  ℹ protoc-gen-ts_proto not found — skipping full wire types");
        return;
    }
    const protoFiles = ["common.proto", "hal_service.proto", "client_service.proto"];
    const cmd = [
        protocBin,
        `--plugin=protoc-gen-ts_proto=${tspPlugin}`,
        `--ts_proto_out=${OUT_GENERATED}`,
        "--ts_proto_opt=esModuleInterop=true",
        "--ts_proto_opt=outputIndex=true",
        "--ts_proto_opt=useOptionals=messages",
        `-I${HAL_PROTOS}`,
        ...protoFiles.map((f) => path.join(HAL_PROTOS, f)),
    ].join(" ");
    try {
        child_process.execSync(cmd, { stdio: "inherit" });
        console.log("  ✓ Full wire types generated via protoc");
    } catch (err) {
        console.warn("  ⚠ protoc failed — falling back to stubs");
    }
}

main();
