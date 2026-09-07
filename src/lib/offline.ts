import { insertRecord } from "@/services/api.ts";

const KEY = "eco-monitor-pending-v1";

export interface PendingItem {
  id: string;
  table: string;
  values: Record<string, unknown>;
  createdAt: string;
}

function read(): PendingItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as PendingItem[];
  } catch {
    return [];
  }
}

function write(items: PendingItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("pending-changed"));
}

export function getPending(table?: string): PendingItem[] {
  const items = read();
  return table ? items.filter((i) => i.table === table) : items;
}

export function queueInsert(table: string, values: Record<string, unknown>) {
  const item: PendingItem = {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    table,
    values,
    createdAt: new Date().toISOString(),
  };
  write([...read(), item]);
  return item;
}

export function removePending(id: string) {
  write(read().filter((i) => i.id !== id));
}

/** Tries to insert immediately via API; falls back to the offline queue. */
export async function saveRecord(table: string, values: Record<string, unknown>) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueInsert(table, values);
    return { synced: false as const };
  }
  try {
    await insertRecord(table, values);
    return { synced: true as const };
  } catch (error) {
    if (isNetworkError(error)) {
      queueInsert(table, values);
      return { synced: false as const };
    }
    throw error;
  }
}

function isNetworkError(error: unknown) {
  const msg =
    error instanceof Error
      ? error.message
      : String((error as { message?: string })?.message ?? "");
  return /fetch|network|Failed to fetch|offline|ECONNREFUSED/i.test(msg);
}

/** Pushes every queued record. Returns how many were synced. */
export async function syncPending(_userId: string | null): Promise<number> {
  const items = read();
  if (!items.length) return 0;
  let synced = 0;
  for (const item of items) {
    try {
      await insertRecord(item.table, item.values);
      removePending(item.id);
      synced += 1;
    } catch (error) {
      if (isNetworkError(error)) break;
      // Permanent failure: drop it so the queue does not block forever.
      removePending(item.id);
    }
  }
  return synced;
}
