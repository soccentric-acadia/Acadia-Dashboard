// Client-side module registry.
// Modules are sourced from the Acadia Server (GET /api/v1/modules).
// Local disk access (Next.js /api/modules route) is prohibited per REQ.md §4.

import { fetchModules, type ModuleInfo } from "@/lib/api/client";

export type { ModuleInfo };

// ---------------------------------------------------------------------------
// Category helper
// ---------------------------------------------------------------------------

// Fallback local category map used only when the server does not supply one.
// Kept intentionally minimal — categories should come from Server as CM-14 fix.
const FALLBACK_CATEGORY: Record<string, string> = {
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

export function getCategoryForModule(module: ModuleInfo | string): string {
    if (typeof module === "string") {
        return FALLBACK_CATEGORY[module] ?? "Other";
    }
    return module.category ?? FALLBACK_CATEGORY[module.id] ?? "Other";
}

// ---------------------------------------------------------------------------
// Registry — fetched from Server
// ---------------------------------------------------------------------------

let _registry: ModuleInfo[] | null = null;

/**
 * Return the module registry from the Server.
 * Results are cached in-memory for the lifetime of the page.
 */
export async function getModuleRegistry(): Promise<ModuleInfo[]> {
    if (_registry) return _registry;
    _registry = await fetchModules();
    return _registry;
}

export function clearModuleRegistryCache(): void {
    _registry = null;
}

export function getModuleLabel(moduleId: string | undefined | null): string {
    if (!moduleId) return "";
    return moduleId
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
