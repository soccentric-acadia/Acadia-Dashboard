/**
 * ResultRendererDispatch — resolves the correct renderer for a result.
 * Checks the registry first; falls back to GenericResultRenderer.
 * This is the single module_id-aware code path in the entire UI.
 */
"use client";

import React from "react";
import { GenericResultRenderer, type ResultRendererProps } from "./generic";
import { registry } from "./registry";

export function ResultRendererDispatch(props: ResultRendererProps) {
    const Renderer = registry[props.result.module_id] ?? GenericResultRenderer;
    return <Renderer {...props} />;
}
