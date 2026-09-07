import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardList, Layers, MapPin, Users } from "lucide-react";
import { RequireAuth } from "@/components/AppShell";
import { PROTOCOLS } from "@/lib/protocols";
import { useAllRecords, type SummaryRow } from "@/lib/useAllRecords";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de monitoramento — Observatorio Caiçara" },
      {
        name: "description",
        content:
          "Resumo das coletas ambientais de campo com filtros por protocolo, pesquisador, local e período.",
      },
      { property: "og:title", content: "Painel de monitoramento — Observatorio Caiçara" },
      {
        property: "og:description",
        content: "Acompanhe registros de 10 protocolos ambientais em um painel único.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { data, isLoading, error } = useAllRecords();
  const [protocolo, setProtocolo] = useState("");
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const rows = useMemo(() => {
    const all = data ?? [];
    const term = busca.trim().toLowerCase();
    return all.filter((r: SummaryRow) => {
      if (protocolo && r.protocolSlug !== protocolo) return false;
      if (de && r.data_coleta < de) return false;
      if (ate && r.data_coleta > ate) return false;
      if (
        term &&
        ![r.pesquisador, r.local_pesquisa, r.ambiente, r.categoria ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
        return false;
      return true;
    });
  }, [data, protocolo, busca, de, ate]);

  const porProtocolo = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.protocolLabel, (map.get(r.protocolLabel) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const pesquisadores = new Set(rows.map((r) => r.pesquisador)).size;
  const locais = new Set(rows.map((r) => r.local_pesquisa)).size;
  const quantidade = rows.reduce((sum, r) => sum + (r.quantidade ?? 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">
            Resumo das coletas registradas nos protocolos de monitoramento.
          </p>
        </div>
        <Button asChild>
          <Link to="/novo">Novo registro</Link>
        </Button>
      </header>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="f-protocolo">Protocolo</Label>
          <select
            id="f-protocolo"
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            {PROTOCOLS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-busca">Buscar</Label>
          <Input
            id="f-busca"
            value={busca}
            placeholder="Pesquisador, local, ambiente…"
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-de">De</Label>
          <Input id="f-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-ate">Até</Label>
          <Input id="f-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </section>

      {error && (
        <p className="text-sm text-destructive">Não foi possível carregar os registros.</p>
      )}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando registros…</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={ClipboardList} label="Registros" value={rows.length} />
            <Stat icon={Layers} label="Indivíduos/itens" value={quantidade} />
            <Stat icon={Users} label="Pesquisadores" value={pesquisadores} />
            <Stat icon={MapPin} label="Locais" value={locais} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Registros por protocolo
              </h2>
              <ul className="mt-3 space-y-2">
                {porProtocolo.length === 0 && (
                  <li className="text-sm text-muted-foreground">Nenhum registro encontrado.</li>
                )}
                {porProtocolo.map(([label, count]) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-sm">{label}</span>
                    <span className="h-2 flex-1 rounded-full bg-secondary">
                      <span
                        className="block h-2 rounded-full bg-primary"
                        style={{ width: `${(count / (porProtocolo[0]?.[1] || 1)) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 text-right text-sm tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Coletas recentes
              </h2>
              <ul className="mt-3 divide-y divide-border">
                {rows.slice(0, 8).map((r) => (
                  <li key={`${r.protocolSlug}-${r.id}`} className="flex flex-wrap gap-x-3 py-2 text-sm">
                    <span className="font-medium">{r.protocolLabel}</span>
                    <span className="text-muted-foreground">{r.local_pesquisa}</span>
                    <span className="ml-auto text-muted-foreground tabular-nums">
                      {r.data_coleta}
                    </span>
                  </li>
                ))}
                {rows.length === 0 && (
                  <li className="py-2 text-sm text-muted-foreground">Nenhuma coleta ainda.</li>
                )}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
