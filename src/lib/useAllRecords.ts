import { useQuery } from "@tanstack/react-query";
import { PROTOCOLS } from "@/lib/protocols";
import { fetchAll } from "@/services/api.ts";

export interface SummaryRow {
  id: string;
  protocolSlug: string;
  protocolLabel: string;
  pesquisador: string;
  local_pesquisa: string;
  ambiente: string;
  data_coleta: string;
  created_at: string;
  categoria: string | null;
  quantidade: number | null;
}

async function loadAll(): Promise<SummaryRow[]> {
  const rows = await fetchAll(PROTOCOLS);
  return rows as SummaryRow[];
}

export function useAllRecords() {
  return useQuery({ queryKey: ["all-records"], queryFn: loadAll });
}
