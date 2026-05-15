/**
 * Renderer registry — maps module_id strings to custom ResultRenderer components.
 *
 * Start empty. The generic renderer covers every module by default.
 * Custom renderers must be justified by genuine display needs that the generic
 * renderer cannot satisfy. This refactor does not introduce any custom renderers.
 *
 * Lookup pattern (used by ResultRendererDispatch):
 *   const Renderer = registry[result.module_id] ?? GenericResultRenderer;
 *   return <Renderer result={result} />;
 *
 * This is the ONLY place in the UI where module_id drives rendering decisions.
 */

import type { ResultRendererProps } from "./generic";

export type ResultRenderer = React.ComponentType<ResultRendererProps>;

import React from "react";

/**
 * Module-specific renderer overrides.
 * Add entries here only for modules with display requirements that the
 * generic renderer genuinely cannot satisfy.
 */
export const registry: Record<string, ResultRenderer> = {
    // Empty — generic renderer is the default for all modules.
};
