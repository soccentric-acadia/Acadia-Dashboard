/**
 * src/data/sim/persistence.ts
 *
 * IndexedDB persistence for the simulation engine using idb-keyval.
 * Stores runs, results, templates, schedules, and audit log.
 */

import { get, set, del, keys } from "idb-keyval";

const PREFIX = "acadia-sim:";

export async function simGet<T>(key: string): Promise<T | undefined> {
    return get<T>(`${PREFIX}${key}`);
}

export async function simSet<T>(key: string, value: T): Promise<void> {
    return set(`${PREFIX}${key}`, value);
}

export async function simDel(key: string): Promise<void> {
    return del(`${PREFIX}${key}`);
}

export async function simKeys(): Promise<string[]> {
    const all = await keys();
    return (all as string[]).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length));
}

export async function simClear(): Promise<void> {
    const ks = await simKeys();
    await Promise.all(ks.map((k) => simDel(k)));
}

/** Backup the entire sim store as a JSON-serializable object */
export async function simBackup(): Promise<Record<string, unknown>> {
    const ks = await simKeys();
    const entries = await Promise.all(ks.map(async (k) => [k, await simGet(k)] as const));
    return Object.fromEntries(entries);
}

/** Restore from a backup object */
export async function simRestore(backup: Record<string, unknown>): Promise<void> {
    await simClear();
    await Promise.all(Object.entries(backup).map(([k, v]) => simSet(k, v)));
}
