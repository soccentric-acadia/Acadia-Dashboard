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

export function getModuleLabel(moduleId: string): string {
    return moduleId
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
