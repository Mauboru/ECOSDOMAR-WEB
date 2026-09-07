import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RequireAuth } from "@/components/AppShell";
import { PROTOCOLS } from "@/lib/protocols";
import { useAllRecords } from "@/lib/useAllRecords";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/graficos")({
  head: () => ({
    meta: [
      { title: "Gráficos e análises — Observatorio Caiçara" },
      {
        name: "description",
        content:
          "Visualize a distribuição das coletas ambientais por protocolo, categoria e evolução no tempo.",
      },
      { property: "og:title", content: "Gráficos e análises — Observatorio Caiçara" },
      {
        property: "og:description",
        content: "Gráficos de barras, pizza e linha para os dados de monitoramento ambiental.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Graficos />
    </RequireAuth>
  ),
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="mt-4 h-72">{children}</div>
    </div>
  );
}

function Graficos() {
  const { data, isLoading } = useAllRecords();
  const [protocolo, setProtocolo] = useState("");

  const rows = useMemo(
    () => (data ?? []).filter((r) => !protocolo || r.protocolSlug === protocolo),
    [data, protocolo],
  );

  const porProtocolo = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.protocolLabel, (map.get(r.protocolLabel) ?? 0) + 1));
    return [...map.entries()].map(([name, total]) => ({ name, total }));
  }, [rows]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const key = r.categoria?.trim() || "Sem categoria";
      map.set(key, (map.get(key) ?? 0) + (r.quantidade ?? 1));
    });
    return [...map.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [rows]);

  const porData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.data_coleta, (map.get(r.data_coleta) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([data, total]) => ({
      data,
      total,
    }));
  }, [rows]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Gráficos</h1>
        <p className="text-sm text-muted-foreground">
          Distribuição e evolução das coletas registradas.
        </p>
      </header>

      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="g-protocolo">Protocolo</Label>
        <select
          id="g-protocolo"
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando dados…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há dados para exibir.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Registros por protocolo">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porProtocolo}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Quantidade por categoria">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porCategoria} dataKey="total" nameKey="name" outerRadius={90} label>
                  {porCategoria.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Coletas ao longo do tempo">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={porData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
