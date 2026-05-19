/**
 * src/proto/types.ts — canonical re-exports for all proto types.
 *
 * Import from here, not from generated/ directly.
 */

import { TestStatus, TestSeverity } from "./generated/common";

export type {
    TypedValue,
    TestOutput,
    TestResult,
    CommonConfig,
    MonitoringParams,
    EventCondition,
} from "./generated/common";

export {
    TestStatus,
    TestSeverity,
    ExecutionMode,
} from "./generated/common";

export type {
    ModuleDefinition,
    ModuleCategory,
    SchemaDescriptor,
    SchemaFieldDescriptor,
} from "./module-catalog";

export {
    MODULE_CATALOG,
    MODULES_BY_CATEGORY,
    CATEGORY_ORDER,
    ALL_MODULE_IDS,
    getModule,
    getModuleOrThrow,
} from "./module-catalog";

// ── String alias helpers ──────────────────────────────────────────────────────

/** Human-readable status string (maps to TestStatus enum values). */
export type StatusString =
    | "PASS"
    | "FAIL"
    | "ERROR"
    | "TIMEOUT"
    | "ABORTED"
    | "SKIPPED"
    | "PARTIAL"
    | "UNSPECIFIED"
    | "RUNNING"
    | "NEVER";

/** Human-readable severity string (maps to TestSeverity enum values). */
export type SeverityString = "INFO" | "WARNING" | "ERROR" | "CRITICAL" | "UNSPECIFIED";

export function statusToString(status: TestStatus): StatusString {
    switch (status) {
        case TestStatus.TEST_STATUS_PASS: return "PASS";
        case TestStatus.TEST_STATUS_FAIL: return "FAIL";
        case TestStatus.TEST_STATUS_ERROR: return "ERROR";
        case TestStatus.TEST_STATUS_TIMEOUT: return "TIMEOUT";
        case TestStatus.TEST_STATUS_ABORTED: return "ABORTED";
        case TestStatus.TEST_STATUS_SKIPPED: return "SKIPPED";
        default: return "UNSPECIFIED";
    }
}

export function severityToString(severity: TestSeverity): SeverityString {
    switch (severity) {
        case TestSeverity.TEST_SEVERITY_INFO: return "INFO";
        case TestSeverity.TEST_SEVERITY_WARNING: return "WARNING";
        case TestSeverity.TEST_SEVERITY_ERROR: return "ERROR";
        case TestSeverity.TEST_SEVERITY_CRITICAL: return "CRITICAL";
        default: return "UNSPECIFIED";
    }
}

