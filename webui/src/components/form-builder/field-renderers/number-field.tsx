"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SchemaField } from "@/lib/schema/module-schema";

interface NumberFieldProps {
    field: SchemaField;
    value: unknown;
    onChange: (v: number) => void;
    error?: string;
}

export function NumberField({ field, value, onChange, error }: NumberFieldProps) {
    const numValue = typeof value === "number" ? value : (value !== undefined && value !== "" ? Number(value) : "");
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
                type="number"
                value={numValue as string | number}
                min={field.min}
                max={field.max}
                onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") return;
                    const parsed = parseFloat(raw);
                    if (!isNaN(parsed)) onChange(parsed);
                }}
                placeholder={String(field.defaultValue ?? "")}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
