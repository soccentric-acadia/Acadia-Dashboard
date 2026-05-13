"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Client } from "@/lib/api/types";
import { fetchClients } from "@/lib/api/client";

interface BoardContextValue {
    board: Client | null;
    boardId: string | null;          // persisted selected clientId
    setBoard: (client: Client) => void;
    clearBoard: () => void;
    isLoading: boolean;
}

const BoardContext = createContext<BoardContextValue>({
    board: null,
    boardId: null,
    setBoard: () => { },
    clearBoard: () => { },
    isLoading: false,
});

const BOARD_KEY = "acadia_board_id";

export function BoardProvider({ children }: { children: React.ReactNode }) {
    const [board, setBoard_] = useState<Client | null>(null);
    const [boardId, setBoardId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load persisted board ID and fetch its data on mount.
    useEffect(() => {
        const stored = localStorage.getItem(BOARD_KEY);
        if (!stored) { setIsLoading(false); return; }
        setBoardId(stored);

        fetchClients()
            .then((clients) => {
                const match = clients.find((c) => c.clientId === stored);
                if (match) setBoard_(match);
            })
            .catch(() => { /* server offline */ })
            .finally(() => setIsLoading(false));
    }, []);

    // Poll board status every 10 s to keep online indicator live.
    useEffect(() => {
        if (!boardId) return;
        const id = setInterval(async () => {
            try {
                const clients = await fetchClients();
                const match = clients.find((c) => c.clientId === boardId);
                if (match) setBoard_(match);
            } catch {
                // keep stale data
            }
        }, 10_000);
        return () => clearInterval(id);
    }, [boardId]);

    const setBoard = useCallback((client: Client) => {
        setBoard_(client);
        setBoardId(client.clientId);
        localStorage.setItem(BOARD_KEY, client.clientId);
    }, []);

    const clearBoard = useCallback(() => {
        setBoard_(null);
        setBoardId(null);
        localStorage.removeItem(BOARD_KEY);
    }, []);

    return (
        <BoardContext.Provider value={{ board, boardId, setBoard, clearBoard, isLoading }}>
            {children}
        </BoardContext.Provider>
    );
}

export function useBoard() {
    return useContext(BoardContext);
}
