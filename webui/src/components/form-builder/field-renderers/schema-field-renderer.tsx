"use client";

import type { SchemaField } from "@/lib/schema/module-schema";
import { StringField } from "./string-field";
import { NumberField } from "./number-field";
import { BoolField } from "./bool-field";
import { EnumField } from "./enum-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SchemaFieldRendererProps {
    field: SchemaField;
    value: unknown;
    onChange: (v: unknown) => void;
    error?: string;
}

/**
 * Dispatches to the correct field renderer based on `field.type`.
 * Falls back to a text Input for unsupported types.
 */
export function SchemaFieldRenderer({ field, value, onChange, error }: SchemaFieldRendererProps) {
    switch (field.type) {
        case "string":
        case "bytes":
            return (
                <StringField
                    field={field}
                    value={value}
                    onChange={onChange}
                    error={error}
                />
            );
        case "int32":
        case "int64":
        case "uint32":
        case "uint64":
        case "float":
        case "double":
            return (
                <NumberField
                    field={field}
                    value={value}
                    onChange={(v) => onChange(v)}
                    error={error}
                />
            );
        case "bool":
            return (
                <BoolField
                    field={field}
                    value={value}
                    onChange={(v) => onChange(v)}
                    error={error}
                />
            );
        case "enum":
            return (
                <EnumField
                    field={field}
                    value={value}
                    onChange={(v) => onChange(v)}
                    error={error}
                />
            );
        case "repeated_scalar":
            // Render as comma-separated text input; stores string[]
            return (
                <div className="space-y-1">
                    <Label htmlFor={`field-${field.name}`}>
                        {field.label ?? field.name}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    <Input
                        id={`field-${field.name}`}
                        placeholder="Comma-separated values (empty = all)"
                        value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
                        onChange={(e) => {
                            const raw = e.target.value;
                            onChange(raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : []);
                        }}
                    />
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
            );
        default:
            // Fallback: render as JSON text for complex types (message, oneof, repeated, Any, Timestamp, Duration)
            return (
                <div className="space-y-1">
                    <Label htmlFor={`field-${field.name}`}>
                        {field.label ?? field.name}
                        <span className="text-xs text-muted-foreground ml-1">({field.type})</span>
                    </Label>
                    {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    <Input
                        id={`field-${field.name}`}
                        placeholder="JSON value"
                        value={typeof value === "string" ? value : JSON.stringify(value ?? null)}
                        onChange={(e) => {
                            try {
                                onChange(JSON.parse(e.target.value));
                            } catch {
                                onChange(e.target.value);
                            }
                        }}
                    />
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
            );
    }
}
