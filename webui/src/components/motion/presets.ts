/**
 * motion/presets — canonical animation timings and easings.
 * Every animated component imports from here. No magic numbers in components.
 */

// ── Easings ───────────────────────────────────────────────────────────────────

export const ease = {
    /** Snappy spring for layout transitions */
    spring: { type: "spring", stiffness: 400, damping: 30 } as const,
    /** Snappy spring for hover lifts */
    hoverSpring: { type: "spring", stiffness: 400, damping: 30 } as const,
    /** Sidebar collapse/expand */
    sidebarSpring: { type: "spring", stiffness: 300, damping: 30 } as const,
    /** Standard ease-out for most transitions */
    easeOut: [0.2, 0, 0, 1] as [number, number, number, number],
    /** Sidebar easing */
    sidebar: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
} as const;

// ── Duration constants (ms / seconds) ────────────────────────────────────────

export const duration = {
    instant: 0.1,
    fast: 0.18,
    normal: 0.2,
    tabSwitch: 0.18,
    pageEnter: 0.2,
    sidebar: 0.25,
    countUp: 0.6,
    resultFlash: 0.6,
    pulse: 1.5,
} as const;

// ── Page transition ───────────────────────────────────────────────────────────

export const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

export const pageTransition = {
    duration: duration.pageEnter,
    ease: ease.easeOut,
};

// ── Tab content switch ────────────────────────────────────────────────────────

export const tabVariants = {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
};

export const tabTransition = {
    duration: duration.tabSwitch,
    ease: ease.easeOut,
};

// ── List item (AnimatePresence) ───────────────────────────────────────────────

export const listItemVariants = {
    initial: { opacity: 0, height: 0, marginTop: 0 },
    animate: { opacity: 1, height: "auto", marginTop: "0.25rem" },
    exit: { opacity: 0, height: 0, marginTop: 0 },
};

export const listItemTransition = {
    duration: duration.fast,
    ease: ease.easeOut,
};

// ── Live result arrival ───────────────────────────────────────────────────────

export const resultArrivalVariants = {
    initial: { opacity: 0, y: -8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
};

export const resultArrivalTransition = {
    duration: duration.fast,
    ease: ease.easeOut,
};

// ── Hover card lift ───────────────────────────────────────────────────────────

export const cardHoverProps = {
    whileHover: { y: -2 },
    transition: ease.hoverSpring,
} as const;

// ── Sheet / drawer entrance (use shadcn defaults, but export transition ref) ──

export const sheetTransition = {
    duration: 0.22,
    ease: ease.easeOut,
};

// ── Status badge cross-fade ───────────────────────────────────────────────────

export const statusBadgeTransition = {
    duration: duration.normal,
    ease: ease.easeOut,
};

// ── Count-up ──────────────────────────────────────────────────────────────────

export const countUpTransition = {
    duration: duration.countUp,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};
