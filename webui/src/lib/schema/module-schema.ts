// Types describing a HAL module's config/result schema, consumed by the form builder.

export type ProtoScalar =
    | "string"
    | "int32"
    | "int64"
    | "uint32"
    | "uint64"
    | "float"
    | "double"
    | "bool"
    | "bytes";

export type ProtoFieldType =
    | ProtoScalar
    | "enum"
    | "message"
    | "repeated_scalar"
    | "repeated_message"
    | "oneof"
    | "google.protobuf.Timestamp"
    | "google.protobuf.Duration"
    | "google.protobuf.Any";

export interface EnumValue {
    name: string;
    number: number;
}

export interface SchemaField {
    name: string;
    type: ProtoFieldType;
    label?: string;
    description?: string;
    required?: boolean;
    defaultValue?: unknown;
    // For enum
    enumValues?: EnumValue[];
    // For message / repeated_message / oneof
    fields?: SchemaField[];
    // For numeric types
    min?: number;
    max?: number;
    // For repeated
    itemType?: ProtoFieldType;
    itemFields?: SchemaField[];
}

export interface ModuleSchema {
    moduleId: string;
    configFields: SchemaField[];
    resultFields: SchemaField[];
}

// ── Catalog descriptor → SchemaField adapter ─────────────────────────────────

import type { SchemaFieldDescriptor } from "@/proto/module-catalog";

/**
 * Convert a `SchemaFieldDescriptor` from the module catalog to a `SchemaField`
 * for use with the form builder.
 *
 * Mapping:
 *   string        → string
 *   string_array  → repeated_scalar (itemType: string)
 *   bool          → bool
 *   int           → int32
 *   double        → double
 *   enum          → enum (options → enumValues, using index as number)
 *   message       → message (fields recursively converted)
 *   test_result_array → skipped (read-only result data, not configurable)
 */
export function descriptorToSchemaField(d: SchemaFieldDescriptor): SchemaField | null {
    switch (d.type) {
        case "string":
            return { name: d.name, type: "string", label: d.label, description: d.description, required: d.required };
        case "string_array":
            return { name: d.name, type: "repeated_scalar", itemType: "string", label: d.label, description: d.description, required: d.required, defaultValue: [] };
        case "bool":
            return { name: d.name, type: "bool", label: d.label, description: d.description, required: d.required, defaultValue: false };
        case "int":
            return { name: d.name, type: "int32", label: d.label, description: d.description, required: d.required };
        case "double":
            return { name: d.name, type: "double", label: d.label, description: d.description, required: d.required };
        case "enum": {
            const enumValues: EnumValue[] = (d.options ?? []).map((opt, i) => ({ name: opt.label, number: i }));
            return { name: d.name, type: "enum", label: d.label, description: d.description, required: d.required, enumValues };
        }
        case "message": {
            const fields = (d.fields ?? []).map(descriptorToSchemaField).filter((f): f is SchemaField => f !== null);
            return { name: d.name, type: "message", label: d.label, description: d.description, required: d.required, fields };
        }
        case "test_result_array":
            // Read-only result data — not a configurable parameter
            return null;
        default:
            return null;
    }
}

/** Convert all fields in a SchemaDescriptor to SchemaField[], filtering out nulls. */
export function descriptorFieldsToSchemaFields(fields: SchemaFieldDescriptor[]): SchemaField[] {
    return fields.map(descriptorToSchemaField).filter((f): f is SchemaField => f !== null);
}
