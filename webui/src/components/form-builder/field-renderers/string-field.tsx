"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SchemaField } from "@/lib/schema/module-schema";

interface StringFieldProps {
    field: SchemaField;
    value: unknown;
    onChange: (v: string) => void;
    error?: string;
}

export function StringField({ field, value, onChange, error }: StringFieldProps) {
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
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.description ?? field.name}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
