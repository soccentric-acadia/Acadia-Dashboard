"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Board } from "@/lib/api/types";
import { fetchBoard } from "@/lib/api/client";

interface BoardContextValue {
    board: Board | null;
    isLoading: boolean;
    refresh: () => void;
}

const BoardContext = createContext<BoardContextValue>({
    board: null,
    isLoading: false,
    refresh: () => {},
});

export function BoardProvider({ children }: { children: React.ReactNode }) {
    const [board, setBoard] = useState<Board | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(() => {
        fetchBoard()
            .then((b) => setBoard(b))
            .catch(() => { /* server offline — keep stale data */ })
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        load();
        // Poll every 15 s to keep status fresh.
        const id = setInterval(load, 15_000);
        return () => clearInterval(id);
    }, [load]);

    return (
        <BoardContext.Provider value={{ board, isLoading, refresh: load }}>
            {children}
        </BoardContext.Provider>
    );
}

export function useBoard() {
    return useContext(BoardContext);
}
