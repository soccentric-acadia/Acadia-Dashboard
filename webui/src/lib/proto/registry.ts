// Client-side module registry.
// Loaded from /api/modules (which serves the bundled modules.yaml).

export interface ModuleInfo {
    id: string;
    proto_package: string;
    config_type: string;
    result_type: string;
    version: number;
    status: "active" | "deprecated";
    source_path: string;
    /** Derived from module ID; not in YAML */
    category?: string;
}

// Maps module id → display category group.
const CATEGORY_MAP: Record<string, string> = {
    cpu: "Processor",
    gpu: "Processor",
    deep_learning_accelerator: "Processor",
    environmental: "Sensors",
    imu: "Sensors",
    gnss: "Sensors",
    ethernet: "Network",
    ethernet_switch: "Network",
    communication_interface: "Network",
    display_interfaces: "Display",
    camera_interfaces: "Camera",
    camera_module3: "Camera",
    audio_interfaces: "Audio",
    gpio: "Peripherals",
    external_connector: "Peripherals",
    mcu_interface: "Peripherals",
    clock_and_timing: "Timing",
    functional_safety: "Safety",
    debug_and_development_interfaces: "Debug",
};

export function getCategoryForModule(moduleId: string): string {
    return CATEGORY_MAP[moduleId] ?? "Other";
}

let _registry: ModuleInfo[] | null = null;

export async function getModuleRegistry(): Promise<ModuleInfo[]> {
    if (_registry) return _registry;
    const res = await fetch("/api/modules");
    if (!res.ok) throw new Error("Failed to load module registry");
    const data = await res.json() as { modules: ModuleInfo[] };
    _registry = data.modules;
    return _registry;
}

export function getModuleLabel(moduleId: string | undefined | null): string {
    if (!moduleId) return "";
    return moduleId
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
