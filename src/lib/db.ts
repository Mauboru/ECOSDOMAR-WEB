import {
  fetchRecords as apiFetchRecords,
  updateRecord as apiUpdateRecord,
  deleteRecord as apiDeleteRecord,
} from "@/services/api.js";

export type RecordRow = Record<string, unknown> & {
  id: string;
  user_id?: string;
  _pending?: boolean;
};

export async function fetchRecords(table: string): Promise<RecordRow[]> {
  const data = await apiFetchRecords(table);
  return ((data ?? []) as RecordRow[]).map((row) => ({
    ...row,
    id: String(row["id"] ?? ""),
  }));
}

export async function updateRecord(table: string, id: string, values: Record<string, unknown>) {
  await apiUpdateRecord(table, id, values);
}

export async function deleteRecord(table: string, id: string) {
  await apiDeleteRecord(table, id);
}

export function toCsv(rows: Record<string, unknown>[], columns: { name: string; label: string }[]) {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(";");
  const body = rows.map((r) => columns.map((c) => escape(r[c.name])).join(";")).join("\\n");
  return `\\uFEFF${header}\\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
