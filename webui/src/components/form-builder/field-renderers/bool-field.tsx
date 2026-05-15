"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { SchemaField } from "@/lib/schema/module-schema";

interface BoolFieldProps {
    field: SchemaField;
    value: unknown;
    onChange: (v: boolean) => void;
    error?: string;
}

export function BoolField({ field, value, onChange, error }: BoolFieldProps) {
    const checked = typeof value === "boolean" ? value : Boolean(field.defaultValue ?? false);
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <Switch
                    id={`field-${field.name}`}
                    checked={checked}
                    onCheckedChange={onChange}
                />
                <Label htmlFor={`field-${field.name}`}>
                    {field.label ?? field.name}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
            </div>
            {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
