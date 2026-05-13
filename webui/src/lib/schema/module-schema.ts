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
