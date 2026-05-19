/**
 * src/data/live/client.ts
 *
 * Live API client wrapping the existing REST client.
 * Re-exports from lib/api/client.ts with a thin adapter.
 */

export {
    fetchHealth,
    fetchBoard,
    fetchRuns,
    fetchRun,
    createRun,
    cancelRun,
    pauseRun,
    resumeRun,
    fetchRunResults,
    fetchGlobalLogs,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    fetchSchedules,
    createSchedule,
    deleteSchedule,
    enableSchedule,
    disableSchedule,
    fetchModuleResults,
    fetchModuleTrend,
    fetchRunCompare,
    fetchOtaList,
    triggerUpgrade,
    fetchNotifications,
    fetchNotificationCount,
    markAllNotificationsRead,
} from "@/lib/api/client";

export type { RunsFilter } from "@/lib/api/client";
