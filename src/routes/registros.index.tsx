import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/AppShell";
import { PROTOCOLS } from "@/lib/protocols";
import { useAllRecords } from "@/lib/useAllRecords";

export const Route = createFileRoute("/registros/")({
  head: () => ({
    meta: [
      { title: "Registros por protocolo — Observatorio Caiçara" },
      {
        name: "description",
        content:
          "Escolha um protocolo para consultar, editar, excluir e exportar os registros de campo.",
      },
      { property: "og:title", content: "Registros por protocolo — Observatorio Caiçara" },
      {
        property: "og:description",
        content: "Listagem completa das coletas por protocolo, com busca e exportação.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <RegistrosIndex />
    </RequireAuth>
  ),
});

function RegistrosIndex() {
  const { data } = useAllRecords();
  const counts = new Map<string, number>();
  (data ?? []).forEach((r) => counts.set(r.protocolSlug, (counts.get(r.protocolSlug) ?? 0) + 1));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Registros</h1>
        <p className="text-sm text-muted-foreground">
          Selecione um protocolo para consultar, editar e exportar os dados.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROTOCOLS.map((p) => (
          <Link
            key={p.slug}
            to="/registros/$slug"
            params={{ slug: p.slug }}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/60 hover:bg-secondary"
          >
            <p className="font-display text-base font-semibold">{p.label}</p>
            <p className="text-sm text-muted-foreground">
              {counts.get(p.slug) ?? 0} registro(s)
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
