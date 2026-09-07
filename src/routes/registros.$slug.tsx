import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/AppShell";
import { PROTOCOLS, protocolBySlug, ALL_COLUMNS } from "@/lib/protocols";
import {
  fetchRecords,
  updateRecord,
  deleteRecord,
  toCsv,
  downloadCsv,
  type RecordRow,
} from "@/lib/db";
import { getPending, removePending } from "@/lib/offline";
import { RecordForm, toPayload, valuesFromRow, type FormValues } from "@/components/RecordForm";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/registros/$slug")({
  head: () => ({
    meta: [
      { title: "Listagem de coletas — Observatorio Caiçara" },
      {
        name: "description",
        content:
          "Consulte, busque, edite, exclua e exporte em CSV/Excel os registros do protocolo selecionado.",
      },
      { property: "og:title", content: "Listagem de coletas — Observatorio Caiçara" },
      {
        property: "og:description",
        content: "Gestão completa dos registros de campo por protocolo ambiental.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ListaRegistros />
    </RequireAuth>
  ),
});

function ListaRegistros() {
  const { slug } = useParams({ from: "/registros/$slug" });
  const protocol = protocolBySlug(slug);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [values, setValues] = useState<FormValues>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["records", slug],
    queryFn: () => fetchRecords(protocol!.table),
    enabled: !!protocol,
  });

  const columns = protocol ? ALL_COLUMNS(protocol) : [];

  const rows = useMemo(() => {
    if (!protocol) return [] as RecordRow[];
    const pending: RecordRow[] = getPending(protocol.table).map((p) => ({
      ...(p.values as Record<string, unknown>),
      id: p.id,
      _pending: true,
    }));
    const all = [...pending, ...(data ?? [])];
    const term = busca.trim().toLowerCase();
    if (!term) return all;
    return all.filter((row) =>
      columns.some((c) => String(row[c.name] ?? "").toLowerCase().includes(term)),
    );
  }, [protocol, data, busca, columns]);

  const del = useMutation({
    mutationFn: async (row: RecordRow) => {
      if (row._pending) {
        removePending(row.id);
        return;
      }
      await deleteRecord(protocol!.table, row.id);
    },
    onSuccess: () => {
      toast.success("Registro excluído");
      void queryClient.invalidateQueries();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir"),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = toPayload(protocol!, values);
      await updateRecord(protocol!.table, editing!.id, payload);
    },
    onSuccess: () => {
      toast.success("Registro atualizado");
      setEditing(null);
      void queryClient.invalidateQueries();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar"),
  });

  if (!protocol) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Protocolo não encontrado.</p>
        <Button asChild variant="outline">
          <Link to="/registros">Ver protocolos</Link>
        </Button>
      </div>
    );
  }

  const exportar = () => {
    downloadCsv(`${protocol.slug}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, columns));
    toast.success("Arquivo CSV/Excel gerado");
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{protocol.label}</h1>
          <p className="text-sm text-muted-foreground">{rows.length} registro(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportar} disabled={rows.length === 0}>
            <Download className="size-4" /> Exportar CSV/Excel
          </Button>
          <Button asChild>
            <Link to="/novo">Novo registro</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {PROTOCOLS.map((p) => (
          <Link
            key={p.slug}
            to="/registros/$slug"
            params={{ slug: p.slug }}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar em todos os campos…"
        className="max-w-sm"
      />

      {error && <p className="text-sm text-destructive">Erro ao carregar registros.</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                {columns.map((c) => (
                  <th key={c.name} className="whitespace-nowrap px-3 py-2 text-left font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  {columns.map((c) => (
                    <td key={c.name} className="max-w-56 truncate px-3 py-2">
                      {String(row[c.name] ?? "")}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {row._pending ? (
                      <span className="mr-2 text-xs text-muted-foreground">pendente</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar"
                        disabled={row["user_id"] !== user?.id}
                        onClick={() => {
                          setEditing(row);
                          setValues(valuesFromRow(protocol, row));
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir"
                      disabled={!row._pending && row["user_id"] !== user?.id}
                      onClick={() => {
                        if (confirm("Excluir este registro?")) del.mutate(row);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar registro — {protocol.label}</DialogTitle>
          </DialogHeader>
          {editing && (
            <RecordForm
              protocol={protocol}
              values={values}
              onChange={setValues}
              onSubmit={() => save.mutate()}
              submitting={save.isPending}
              submitLabel="Salvar alterações"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
