/**
 * <ModuleIcon> — resolves a lucide icon for a module's hardware category.
 * Single source of truth for icon-to-module mapping. No switch(module_id) anywhere else.
 */
import * as React from "react";
import {
    Cpu, MemoryStick, HardDrive, Network, Cable, Thermometer,
    Monitor, Camera, Music, Zap, Shield, Bug, Radio, Gauge,
    Clock, Wifi, Bluetooth, ChevronRight, Package,
} from "lucide-react";
import { getCategoryForModule } from "@/lib/proto/registry";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    "Processor": Cpu,
    "Memory": MemoryStick,
    "Storage": HardDrive,
    "Network": Network,
    "Peripherals": Cable,
    "Sensors": Thermometer,
    "Display": Monitor,
    "Camera": Camera,
    "Audio": Music,
    "Power": Zap,
    "Safety": Shield,
    "Debug": Bug,
    "Timing": Clock,
    "Wireless": Radio,
};

// Fine-grained overrides by module id prefix
const ID_ICON_OVERRIDES: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    cpu: Cpu,
    gpu: Cpu,
    ethernet: Network,
    wifi: Wifi,
    bluetooth: Bluetooth,
    environmental: Thermometer,
    imu: Gauge,
    gnss: Radio,
    gpio: Cable,
    display: Monitor,
    camera: Camera,
    audio: Music,
    clock: Clock,
    memory: MemoryStick,
    storage: HardDrive,
    power: Zap,
    safety: Shield,
    debug: Bug,
};

const SIZE_MAP = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
};

export interface ModuleIconProps {
    moduleId: string;
    size?: keyof typeof SIZE_MAP;
    className?: string;
}

export function ModuleIcon({ moduleId, size = "sm", className }: ModuleIconProps) {
    // Try fine-grained id prefix match first
    const idKey = Object.keys(ID_ICON_OVERRIDES).find((k) => moduleId.startsWith(k));
    const IconFromId = idKey ? ID_ICON_OVERRIDES[idKey] : null;

    // Fallback to category
    const category = getCategoryForModule(moduleId);
    const IconFromCategory = CATEGORY_ICONS[category] ?? Package;

    const Icon = IconFromId ?? IconFromCategory;

    return (
        <Icon
            className={cn(SIZE_MAP[size], "shrink-0", className)}
            aria-hidden="true"
        />
    );
}

/** Returns the icon component for a category string (for use outside ModuleIcon). */
export function getCategoryIcon(
    category: string,
): React.ComponentType<React.SVGProps<SVGSVGElement>> {
    return CATEGORY_ICONS[category] ?? ChevronRight;
}
