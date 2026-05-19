/**
 * MODULE CATALOG — AUTO-GENERATED
 *
 * Source: Acadia-HAL/protos/registry/modules.yaml
 * Generator: scripts/generate-from-protos.ts
 *
 * DO NOT EDIT MANUALLY — run `npm run gen` to regenerate.
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
  "audio_interfaces": {
    id: "audio_interfaces",
    displayName: "Audio Interfaces",
    description: "Audio Interfaces hardware validation and testing",
    category: "peripherals" as ModuleCategory,
    iconHint: "Volume2",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.audio_interfaces",
    configTypeUrl: "hal.modules.audio_interfaces.Config",
    resultTypeUrl: "hal.modules.audio_interfaces.Result",
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
    observableMetricKeys: ["snr_db","thd_pct","latency_ms"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "camera_interfaces": {
    id: "camera_interfaces",
    displayName: "Camera Interfaces",
    description: "Camera Interfaces hardware validation and testing",
    category: "peripherals" as ModuleCategory,
    iconHint: "Camera",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.camera_interfaces",
    configTypeUrl: "hal.modules.camera_interfaces.Config",
    resultTypeUrl: "hal.modules.camera_interfaces.Result",
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
    observableMetricKeys: ["fps","resolution_mpx","snr_db"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "camera_module3": {
    id: "camera_module3",
    displayName: "Camera Module3",
    description: "Camera Module3 hardware validation and testing",
    category: "peripherals" as ModuleCategory,
    iconHint: "Camera",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.camera_module3",
    configTypeUrl: "hal.modules.camera_module3.Config",
    resultTypeUrl: "hal.modules.camera_module3.Result",
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
    observableMetricKeys: ["fps","resolution_mpx","exposure_us"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "clock_and_timing": {
    id: "clock_and_timing",
    displayName: "Clock And Timing",
    description: "Clock And Timing hardware validation and testing",
    category: "timing" as ModuleCategory,
    iconHint: "Clock",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.clock_and_timing",
    configTypeUrl: "hal.modules.clock_and_timing.Config",
    resultTypeUrl: "hal.modules.clock_and_timing.Result",
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
    observableMetricKeys: ["jitter_ps","accuracy_ppb","freq_hz"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "communication_interface": {
    id: "communication_interface",
    displayName: "Communication Interface",
    description: "Communication Interface hardware validation and testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Radio",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.communication_interface",
    configTypeUrl: "hal.modules.communication_interface.Config",
    resultTypeUrl: "hal.modules.communication_interface.Result",
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
    observableMetricKeys: ["throughput_mbps","latency_us","error_rate"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "cpu": {
    id: "cpu",
    displayName: "Cpu",
    description: "Cpu hardware validation and testing",
    category: "compute" as ModuleCategory,
    iconHint: "Cpu",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.cpu",
    configTypeUrl: "hal.modules.cpu.Config",
    resultTypeUrl: "hal.modules.cpu.Result",
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
    observableMetricKeys: ["cpu_load_pct","cpu_freq_mhz","cache_miss_rate","context_switches"],
    monitoringKeys: ["cpu_load_pct","cpu_temp_celsius"],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "debug_and_development_interfaces": {
    id: "debug_and_development_interfaces",
    displayName: "Debug And Development Interfaces",
    description: "Debug And Development Interfaces hardware validation and testing",
    category: "debug" as ModuleCategory,
    iconHint: "Bug",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.debug_and_development_interfaces",
    configTypeUrl: "hal.modules.debug_and_development_interfaces.Config",
    resultTypeUrl: "hal.modules.debug_and_development_interfaces.Result",
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
    observableMetricKeys: ["jtag_speed_mhz","uart_baud_rate","breakpoint_latency_us"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "deep_learning_accelerator": {
    id: "deep_learning_accelerator",
    displayName: "Deep Learning Accelerator",
    description: "Deep Learning Accelerator hardware validation and testing",
    category: "compute" as ModuleCategory,
    iconHint: "Brain",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.deep_learning_accelerator",
    configTypeUrl: "hal.modules.deep_learning_accelerator.Config",
    resultTypeUrl: "hal.modules.deep_learning_accelerator.Result",
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
    observableMetricKeys: ["inference_fps","power_mw","utilization_pct"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "display_interfaces": {
    id: "display_interfaces",
    displayName: "Display Interfaces",
    description: "Display Interfaces hardware validation and testing",
    category: "peripherals" as ModuleCategory,
    iconHint: "Monitor",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.display_interfaces",
    configTypeUrl: "hal.modules.display_interfaces.Config",
    resultTypeUrl: "hal.modules.display_interfaces.Result",
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
    observableMetricKeys: ["refresh_rate_hz","resolution_px","color_depth_bpp"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "environmental": {
    id: "environmental",
    displayName: "Environmental",
    description: "Environmental hardware validation and testing",
    category: "sensors" as ModuleCategory,
    iconHint: "Wind",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.environmental",
    configTypeUrl: "hal.modules.environmental.Config",
    resultTypeUrl: "hal.modules.environmental.Result",
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
    observableMetricKeys: ["temp_celsius","humidity_pct","pressure_hpa"],
    monitoringKeys: ["temp_celsius","humidity_pct"],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "ethernet": {
    id: "ethernet",
    displayName: "Ethernet",
    description: "Ethernet hardware validation and testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Network",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.ethernet",
    configTypeUrl: "hal.modules.ethernet.Config",
    resultTypeUrl: "hal.modules.ethernet.Result",
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
    observableMetricKeys: ["throughput_mbps","latency_us","packet_loss_pct","error_rate"],
    monitoringKeys: ["throughput_mbps","error_rate"],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "ethernet_switch": {
    id: "ethernet_switch",
    displayName: "Ethernet Switch",
    description: "Ethernet Switch hardware validation and testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Network",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.ethernet_switch",
    configTypeUrl: "hal.modules.ethernet_switch.Config",
    resultTypeUrl: "hal.modules.ethernet_switch.Result",
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
    observableMetricKeys: ["throughput_mbps","port_errors","forwarding_rate"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "external_connector": {
    id: "external_connector",
    displayName: "External Connector",
    description: "External Connector hardware validation and testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Plug",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.external_connector",
    configTypeUrl: "hal.modules.external_connector.Config",
    resultTypeUrl: "hal.modules.external_connector.Result",
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
    observableMetricKeys: ["contact_resistance_mohm","insertion_force_n"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "functional_safety": {
    id: "functional_safety",
    displayName: "Functional Safety",
    description: "Functional Safety hardware validation and testing",
    category: "safety" as ModuleCategory,
    iconHint: "ShieldCheck",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.functional_safety",
    configTypeUrl: "hal.modules.functional_safety.Config",
    resultTypeUrl: "hal.modules.functional_safety.Result",
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
    observableMetricKeys: ["fault_detection_time_ms","dcls_pct","spfm_pct"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "gnss": {
    id: "gnss",
    displayName: "Gnss",
    description: "Gnss hardware validation and testing",
    category: "sensors" as ModuleCategory,
    iconHint: "MapPin",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.gnss",
    configTypeUrl: "hal.modules.gnss.Config",
    resultTypeUrl: "hal.modules.gnss.Result",
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
    observableMetricKeys: ["satellites_visible","hdop","fix_time_s","accuracy_m"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "gpio": {
    id: "gpio",
    displayName: "Gpio",
    description: "Gpio hardware validation and testing",
    category: "io" as ModuleCategory,
    iconHint: "Cable",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.gpio",
    configTypeUrl: "hal.modules.gpio.Config",
    resultTypeUrl: "hal.modules.gpio.Result",
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
    observableMetricKeys: ["voltage_v","toggle_freq_hz","error_count"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "gpu": {
    id: "gpu",
    displayName: "Gpu",
    description: "Gpu hardware validation and testing",
    category: "compute" as ModuleCategory,
    iconHint: "Layers",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.gpu",
    configTypeUrl: "hal.modules.gpu.Config",
    resultTypeUrl: "hal.modules.gpu.Result",
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
    observableMetricKeys: ["gpu_load_pct","gpu_freq_mhz","memory_bw_gbps"],
    monitoringKeys: ["gpu_load_pct","gpu_temp_celsius"],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "imu": {
    id: "imu",
    displayName: "Imu",
    description: "Imu hardware validation and testing",
    category: "sensors" as ModuleCategory,
    iconHint: "Compass",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.imu",
    configTypeUrl: "hal.modules.imu.Config",
    resultTypeUrl: "hal.modules.imu.Result",
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
    observableMetricKeys: ["accel_x","accel_y","accel_z","gyro_x","gyro_y","gyro_z"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "mcu_interface": {
    id: "mcu_interface",
    displayName: "Mcu Interface",
    description: "Mcu Interface hardware validation and testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Microchip",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.mcu_interface",
    configTypeUrl: "hal.modules.mcu_interface.Config",
    resultTypeUrl: "hal.modules.mcu_interface.Result",
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
    observableMetricKeys: ["rtt_us","error_count","fw_version"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "pcie": {
    id: "pcie",
    displayName: "Pcie",
    description: "Pcie hardware validation and testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Circuit",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.pcie",
    configTypeUrl: "hal.modules.pcie.Config",
    resultTypeUrl: "hal.modules.pcie.Result",
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
    observableMetricKeys: ["link_speed_gbps","link_width","error_count","bandwidth_gbps"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "poe_hat": {
    id: "poe_hat",
    displayName: "Poe Hat",
    description: "Poe Hat hardware validation and testing",
    category: "power" as ModuleCategory,
    iconHint: "Zap",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.poe_hat",
    configTypeUrl: "hal.modules.poe_hat.Config",
    resultTypeUrl: "hal.modules.poe_hat.Result",
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
    observableMetricKeys: ["power_budget_mw","voltage_v","current_ma"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "power_management": {
    id: "power_management",
    displayName: "Power Management",
    description: "Power Management hardware validation and testing",
    category: "power" as ModuleCategory,
    iconHint: "Zap",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.power_management",
    configTypeUrl: "hal.modules.power_management.Config",
    resultTypeUrl: "hal.modules.power_management.Result",
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
    observableMetricKeys: ["voltage_mv","current_ma","power_mw"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "reliability": {
    id: "reliability",
    displayName: "Reliability",
    description: "Reliability hardware validation and testing",
    category: "safety" as ModuleCategory,
    iconHint: "ShieldCheck",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.reliability",
    configTypeUrl: "hal.modules.reliability.Config",
    resultTypeUrl: "hal.modules.reliability.Result",
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
    observableMetricKeys: ["mtbf_hours","fault_count","recovery_time_ms"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "security_features": {
    id: "security_features",
    displayName: "Security Features",
    description: "Security Features hardware validation and testing",
    category: "security" as ModuleCategory,
    iconHint: "Lock",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.security_features",
    configTypeUrl: "hal.modules.security_features.Config",
    resultTypeUrl: "hal.modules.security_features.Result",
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
    observableMetricKeys: ["secure_boot_time_ms","crypto_ops_per_sec","entropy_bits"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "sense_hat": {
    id: "sense_hat",
    displayName: "Sense Hat",
    description: "Sense Hat hardware validation and testing",
    category: "sensors" as ModuleCategory,
    iconHint: "Gauge",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.sense_hat",
    configTypeUrl: "hal.modules.sense_hat.Config",
    resultTypeUrl: "hal.modules.sense_hat.Result",
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
    observableMetricKeys: ["temp_celsius","humidity_pct","pressure_hpa","orientation_deg"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "serializer_deserializer": {
    id: "serializer_deserializer",
    displayName: "Serializer Deserializer",
    description: "Serializer Deserializer hardware validation and testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "ArrowLeftRight",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.serializer_deserializer",
    configTypeUrl: "hal.modules.serializer_deserializer.Config",
    resultTypeUrl: "hal.modules.serializer_deserializer.Result",
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
    observableMetricKeys: ["bit_rate_gbps","ber","signal_quality_db"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "software_interface": {
    id: "software_interface",
    displayName: "Software Interface",
    description: "Software Interface hardware validation and testing",
    category: "debug" as ModuleCategory,
    iconHint: "Code",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.software_interface",
    configTypeUrl: "hal.modules.software_interface.Config",
    resultTypeUrl: "hal.modules.software_interface.Result",
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
    observableMetricKeys: ["api_latency_us","memory_kb","cpu_pct"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "storage": {
    id: "storage",
    displayName: "Storage",
    description: "Storage hardware validation and testing",
    category: "storage" as ModuleCategory,
    iconHint: "HardDrive",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.storage",
    configTypeUrl: "hal.modules.storage.Config",
    resultTypeUrl: "hal.modules.storage.Result",
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
    observableMetricKeys: ["read_mbps","write_mbps","iops","latency_us"],
    monitoringKeys: ["read_mbps","write_mbps"],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "system_integration": {
    id: "system_integration",
    displayName: "System Integration",
    description: "System Integration hardware validation and testing",
    category: "system" as ModuleCategory,
    iconHint: "Layers",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.system_integration",
    configTypeUrl: "hal.modules.system_integration.Config",
    resultTypeUrl: "hal.modules.system_integration.Result",
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
    observableMetricKeys: ["boot_time_ms","latency_us","error_count"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "system_memory": {
    id: "system_memory",
    displayName: "System Memory",
    description: "System Memory hardware validation and testing",
    category: "compute" as ModuleCategory,
    iconHint: "MemoryStick",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.system_memory",
    configTypeUrl: "hal.modules.system_memory.Config",
    resultTypeUrl: "hal.modules.system_memory.Result",
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
    observableMetricKeys: ["bandwidth_gbps","latency_ns","error_count"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "thermal_management": {
    id: "thermal_management",
    displayName: "Thermal Management",
    description: "Thermal Management hardware validation and testing",
    category: "sensors" as ModuleCategory,
    iconHint: "Thermometer",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.thermal_management",
    configTypeUrl: "hal.modules.thermal_management.Config",
    resultTypeUrl: "hal.modules.thermal_management.Result",
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
    observableMetricKeys: ["temp_celsius","throttle_events","cooling_rate"],
    monitoringKeys: ["temp_celsius","throttle_events"],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "usb": {
    id: "usb",
    displayName: "Usb",
    description: "Usb hardware validation and testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Usb",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.usb",
    configTypeUrl: "hal.modules.usb.Config",
    resultTypeUrl: "hal.modules.usb.Result",
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
    observableMetricKeys: ["transfer_rate_mbps","error_count","latency_us"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "video_encode_decode": {
    id: "video_encode_decode",
    displayName: "Video Encode Decode",
    description: "Video Encode Decode hardware validation and testing",
    category: "compute" as ModuleCategory,
    iconHint: "Video",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.video_encode_decode",
    configTypeUrl: "hal.modules.video_encode_decode.Config",
    resultTypeUrl: "hal.modules.video_encode_decode.Result",
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
    observableMetricKeys: ["fps","bitrate_mbps","latency_ms"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "vision_accelerator": {
    id: "vision_accelerator",
    displayName: "Vision Accelerator",
    description: "Vision Accelerator hardware validation and testing",
    category: "compute" as ModuleCategory,
    iconHint: "Eye",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.vision_accelerator",
    configTypeUrl: "hal.modules.vision_accelerator.Config",
    resultTypeUrl: "hal.modules.vision_accelerator.Result",
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
    observableMetricKeys: ["inference_fps","latency_ms","power_mw"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "watchdog_and_reset": {
    id: "watchdog_and_reset",
    displayName: "Watchdog And Reset",
    description: "Watchdog And Reset hardware validation and testing",
    category: "safety" as ModuleCategory,
    iconHint: "RefreshCcw",
    version: "1",
    status: "active",
    protoPackage: "hal.modules.watchdog_and_reset",
    configTypeUrl: "hal.modules.watchdog_and_reset.Config",
    resultTypeUrl: "hal.modules.watchdog_and_reset.Result",
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
    observableMetricKeys: ["reset_count","timeout_ms","kick_interval_ms"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "i2c": {
    id: "i2c",
    displayName: "I2C Bus",
    description: "I2C bus communication testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Cable",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.i2c",
    configTypeUrl: "type.googleapis.com/hal.modules.i2c.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.i2c.Result",
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
    observableMetricKeys: ["transfer_rate_kbps","ack_errors","arbitration_lost"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING"],
  },
  "spi": {
    id: "spi",
    displayName: "SPI Bus",
    description: "SPI bus communication testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Cable",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.spi",
    configTypeUrl: "type.googleapis.com/hal.modules.spi.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.spi.Result",
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
    observableMetricKeys: ["transfer_rate_mbps","error_count"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM"],
  },
  "uart": {
    id: "uart",
    displayName: "UART",
    description: "UART/serial communication testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Cable",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.uart",
    configTypeUrl: "type.googleapis.com/hal.modules.uart.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.uart.Result",
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
    observableMetricKeys: ["baud_rate_bps","error_count","framing_errors"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING"],
  },
  "rtc": {
    id: "rtc",
    displayName: "Real-Time Clock",
    description: "Real-time clock accuracy and persistence testing",
    category: "timing" as ModuleCategory,
    iconHint: "Clock",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.rtc",
    configTypeUrl: "type.googleapis.com/hal.modules.rtc.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.rtc.Result",
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
    observableMetricKeys: ["drift_ppm","offset_ms","accuracy_ppm"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "MONITORING"],
  },
  "battery": {
    id: "battery",
    displayName: "Battery Management",
    description: "Battery charge, health, and capacity testing",
    category: "power" as ModuleCategory,
    iconHint: "Battery",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.battery",
    configTypeUrl: "type.googleapis.com/hal.modules.battery.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.battery.Result",
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
    observableMetricKeys: ["voltage_mv","current_ma","soc_pct","temp_celsius"],
    monitoringKeys: ["soc_pct","voltage_mv","temp_celsius"],
    eventKeys: ["voltage_threshold_mv","soc_threshold_pct"],
    supportedModes: ["SINGLE_SHOT", "MONITORING", "EVENT_BASED"],
  },
  "nvme": {
    id: "nvme",
    displayName: "NVMe Storage",
    description: "NVMe SSD performance and health testing",
    category: "storage" as ModuleCategory,
    iconHint: "HardDrive",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.nvme",
    configTypeUrl: "type.googleapis.com/hal.modules.nvme.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.nvme.Result",
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
    observableMetricKeys: ["read_mbps","write_mbps","iops","latency_us","smart_health"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM"],
  },
  "emmc": {
    id: "emmc",
    displayName: "eMMC Storage",
    description: "eMMC flash storage testing",
    category: "storage" as ModuleCategory,
    iconHint: "HardDrive",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.emmc",
    configTypeUrl: "type.googleapis.com/hal.modules.emmc.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.emmc.Result",
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
    observableMetricKeys: ["read_mbps","write_mbps","erase_count","health_pct"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM"],
  },
  "can_bus": {
    id: "can_bus",
    displayName: "CAN Bus",
    description: "CAN bus communication and error testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Network",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.can_bus",
    configTypeUrl: "type.googleapis.com/hal.modules.can_bus.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.can_bus.Result",
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
    observableMetricKeys: ["frame_rate_fps","error_frame_count","bus_load_pct"],
    monitoringKeys: [],
    eventKeys: ["error_frame_threshold","bus_load_threshold_pct"],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM", "MONITORING", "EVENT_BASED"],
  },
  "rs485": {
    id: "rs485",
    displayName: "RS-485",
    description: "RS-485 half-duplex serial bus testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Cable",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.rs485",
    configTypeUrl: "type.googleapis.com/hal.modules.rs485.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.rs485.Result",
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
    observableMetricKeys: ["transfer_rate_kbps","error_count","framing_errors"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM"],
  },
  "analog_input": {
    id: "analog_input",
    displayName: "Analog Input (ADC)",
    description: "ADC analog input measurement and linearity testing",
    category: "io" as ModuleCategory,
    iconHint: "Sliders",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.analog_input",
    configTypeUrl: "type.googleapis.com/hal.modules.analog_input.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.analog_input.Result",
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
    observableMetricKeys: ["voltage_v","noise_mv","linearity_pct"],
    monitoringKeys: [],
    eventKeys: ["voltage_threshold_v","noise_threshold_mv"],
    supportedModes: ["SINGLE_SHOT", "MONITORING", "EVENT_BASED"],
  },
  "pwm_output": {
    id: "pwm_output",
    displayName: "PWM Output",
    description: "PWM output frequency and duty cycle testing",
    category: "io" as ModuleCategory,
    iconHint: "Waves",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.pwm_output",
    configTypeUrl: "type.googleapis.com/hal.modules.pwm_output.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.pwm_output.Result",
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
    observableMetricKeys: ["freq_hz","duty_cycle_pct","rise_time_ns"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM"],
  },
  "sd_card": {
    id: "sd_card",
    displayName: "SD Card",
    description: "SD card read/write performance and reliability testing",
    category: "storage" as ModuleCategory,
    iconHint: "HardDrive",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.sd_card",
    configTypeUrl: "type.googleapis.com/hal.modules.sd_card.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.sd_card.Result",
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
    observableMetricKeys: ["read_mbps","write_mbps","error_count"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "LONG_TERM"],
  },
  "bluetooth": {
    id: "bluetooth",
    displayName: "Bluetooth",
    description: "Bluetooth radio and pairing testing",
    category: "connectivity" as ModuleCategory,
    iconHint: "Bluetooth",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.bluetooth",
    configTypeUrl: "type.googleapis.com/hal.modules.bluetooth.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.bluetooth.Result",
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
    observableMetricKeys: ["rssi_dbm","throughput_kbps","pair_time_ms"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "MONITORING"],
  },
  "mipi_csi": {
    id: "mipi_csi",
    displayName: "MIPI CSI Camera Interface",
    description: "MIPI CSI-2 camera lane and signal testing",
    category: "peripherals" as ModuleCategory,
    iconHint: "Camera",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.mipi_csi",
    configTypeUrl: "type.googleapis.com/hal.modules.mipi_csi.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.mipi_csi.Result",
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
    observableMetricKeys: ["lanes_active","bit_rate_gbps","error_count"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "MONITORING"],
  },
  "mipi_dsi": {
    id: "mipi_dsi",
    displayName: "MIPI DSI Display Interface",
    description: "MIPI DSI display lane and signal testing",
    category: "peripherals" as ModuleCategory,
    iconHint: "Monitor",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.mipi_dsi",
    configTypeUrl: "type.googleapis.com/hal.modules.mipi_dsi.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.mipi_dsi.Result",
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
    observableMetricKeys: ["lanes_active","bit_rate_gbps","refresh_rate_hz"],
    monitoringKeys: [],
    eventKeys: [],
    supportedModes: ["SINGLE_SHOT", "MONITORING"],
  },
  "accelerometer": {
    id: "accelerometer",
    displayName: "Accelerometer",
    description: "Accelerometer sensor calibration and range testing",
    category: "sensors" as ModuleCategory,
    iconHint: "Activity",
    version: "1.0.0",
    status: "active",
    protoPackage: "hal.modules.accelerometer",
    configTypeUrl: "type.googleapis.com/hal.modules.accelerometer.Config",
    resultTypeUrl: "type.googleapis.com/hal.modules.accelerometer.Result",
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
    observableMetricKeys: ["accel_x","accel_y","accel_z","noise_mg"],
    monitoringKeys: [],
    eventKeys: ["shock_threshold_mg","axis"],
    supportedModes: ["SINGLE_SHOT", "MONITORING", "EVENT_BASED"],
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULE_CATALOG[id];
}

export function getModuleOrThrow(id: string): ModuleDefinition {
  const m = MODULE_CATALOG[id];
  if (!m) throw new Error(`Unknown module: ${id}`);
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
