/**
 * Vitest global setup — jsdom environment mocks for Next.js App Router pages.
 * Each test file vi.mock()s its own query hooks.
 */
import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// next/navigation
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
    useSearchParams: () => ({ get: () => null }),
    usePathname: () => "/",
    useParams: () => ({}),
}));

// ---------------------------------------------------------------------------
// next-themes
// ---------------------------------------------------------------------------
vi.mock("next-themes", () => ({
    useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Board context
// ---------------------------------------------------------------------------
vi.mock("@/lib/board/context", () => ({
    useBoard: () => ({ board: null, isLoading: false, refresh: vi.fn() }),
    BoardProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// motion/react — skip animation, just render the element
// ---------------------------------------------------------------------------
vi.mock("motion/react", () => {
    const { forwardRef, createElement } = require("react") as typeof React;
    const makeTag = (tag: string) =>
        forwardRef(
            (
                { children, initial: _i, animate: _a, exit: _e, variants: _v, transition: _t, ...rest }: React.PropsWithChildren<Record<string, unknown>>,
                ref: React.Ref<unknown>,
            ) => createElement(tag, { ...rest, ref }, children),
        );
    return {
        motion: new Proxy({}, { get: (_t, tag: string) => makeTag(tag) }),
        AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    };
});

// ---------------------------------------------------------------------------
// sonner — capture toast calls for assertion
// ---------------------------------------------------------------------------
vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
    Toaster: () => null,
}));

