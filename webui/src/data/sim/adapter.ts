/**
 * src/data/sim/adapter.ts
 *
 * Converts proto TestResult (from the sim engine) → REST TestResult
 * (from @/lib/api/types) so the existing UI components can render sim results
 * without modification.
 *
 * Mapping:
 *   proto.moduleId      → rest.module_id
 *   proto.testId        → rest.test_id
 *   proto.output.status → rest.status
 *   proto.output.metrics → rest.metrics
 *   ... etc.
 */

import type { TestResult as ProtoTestResult } from "@/proto/types";
import { statusToString, severityToString } from "@/proto/types";
import type { TestResult as RestTestResult, Status, Severity } from "@/lib/api/types";

export function protoResultToRestResult(
    proto: ProtoTestResult,
    runId: string = "sim"
): RestTestResult {
    const statusStr = proto.output?.status != null
        ? statusToString(proto.output.status)
        : "UNSPECIFIED";
    const severityStr = proto.output?.severity != null
        ? severityToString(proto.output.severity)
        : "INFO";

    const timestamp = proto.timestamp instanceof Date
        ? proto.timestamp.toISOString()
        : (proto.timestamp as unknown as string ?? new Date().toISOString());

    const durationNs = proto.duration
        ? (proto.duration.seconds * 1_000_000_000) + (proto.duration.nanos ?? 0)
        : 0;

    // Convert proto TypedValue to REST TypedValue (identical structure)
    const convertTypedValues = (
        m: Record<string, { boolValue?: boolean; intValue?: number; doubleValue?: number; stringValue?: string }>
    ): Record<string, { type: string; value: unknown }> => {
        const out: Record<string, { type: string; value: unknown }> = {};
        for (const [key, tv] of Object.entries(m)) {
            if (tv.boolValue !== undefined) {
                out[key] = { type: "bool", value: tv.boolValue };
            } else if (tv.intValue !== undefined) {
                out[key] = { type: "int", value: tv.intValue };
            } else if (tv.doubleValue !== undefined) {
                out[key] = { type: "double", value: tv.doubleValue };
            } else if (tv.stringValue !== undefined) {
                out[key] = { type: "string", value: tv.stringValue };
            } else {
                out[key] = { type: "string", value: "" };
            }
        }
        return out;
    };

    const subtests: RestTestResult[] = (proto.subtests ?? []).map((sub) =>
        protoResultToRestResult(sub, runId)
    );

    return {
        id: `sim-${proto.moduleId}-${proto.sequence}`,
        run_id: runId,
        module_id: proto.moduleId,
        module_version: "sim",
        test_id: proto.testId,
        name: proto.name,
        sequence: proto.sequence,
        timestamp,
        duration_ns: durationNs,
        mode: "single_shot",
        status: (statusStr === "UNSPECIFIED" ? "PASS" : statusStr) as Status,
        severity: (severityStr === "UNSPECIFIED" ? "INFO" : severityStr) as Severity,
        error_message: proto.output?.errorMessage ?? "",
        reason: proto.output?.reason ?? {},
        metrics: convertTypedValues(proto.output?.metrics ?? {}) as never,
        monitoring: convertTypedValues(proto.output?.monitoring ?? {}) as never,
        event: convertTypedValues(proto.output?.event ?? {}) as never,
        subtests,
        payload_type_url: "",
        payload_b64: "",
    };
}

export function protoResultsToRestResults(
    results: ProtoTestResult[],
    runId?: string
): RestTestResult[] {
    return results.map((r) => protoResultToRestResult(r, runId));
}
