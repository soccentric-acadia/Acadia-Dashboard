"use client";

import type { SchemaField } from "@/lib/schema/module-schema";
import { SchemaFieldRenderer } from "./field-renderers/schema-field-renderer";

interface SchemaFormProps {
    /** Ordered list of proto-derived config fields. */
    fields: SchemaField[];
    /** Current flat value object keyed by field name. */
    value: Record<string, unknown>;
    /** Called whenever any field changes. */
    onChange: (v: Record<string, unknown>) => void;
    /** Optional per-field error messages keyed by field name. */
    errors?: Record<string, string>;
}

/**
 * Generic schema-driven form.
 * Renders a `SchemaFieldRenderer` per field and keeps a flat Record<string, unknown> as state.
 */
export function SchemaForm({ fields, value, onChange, errors = {} }: SchemaFormProps) {
    const handleFieldChange = (name: string, fieldValue: unknown) => {
        onChange({ ...value, [name]: fieldValue });
    };

    if (fields.length === 0) {
        return (
            <p className="text-xs text-muted-foreground italic">
                This module has no configurable parameters.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {fields.map((field) => (
                <SchemaFieldRenderer
                    key={field.name}
                    field={field}
                    value={value[field.name] ?? field.defaultValue}
                    onChange={(v) => handleFieldChange(field.name, v)}
                    error={errors[field.name]}
                />
            ))}
        </div>
    );
}
