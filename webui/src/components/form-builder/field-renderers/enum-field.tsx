"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { SchemaField } from "@/lib/schema/module-schema";

interface EnumFieldProps {
    field: SchemaField;
    value: unknown;
    onChange: (v: number) => void;
    error?: string;
}

export function EnumField({ field, value, onChange, error }: EnumFieldProps) {
    const values = field.enumValues ?? [];
    const current = typeof value === "number" ? String(value) : "";
    return (
        <div className="space-y-1">
            <Label htmlFor={`field-${field.name}`}>
                {field.label ?? field.name}
                {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <Select
                value={current}
                onValueChange={(v) => onChange(Number(v))}
            >
                <SelectTrigger id={`field-${field.name}`}>
                    <SelectValue placeholder={`Select ${field.label ?? field.name}…`} />
                </SelectTrigger>
                <SelectContent>
                    {values.map((ev) => (
                        <SelectItem key={ev.number} value={String(ev.number)}>
                            {ev.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
