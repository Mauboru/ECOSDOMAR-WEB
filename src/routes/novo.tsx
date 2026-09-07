import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequireAuth } from "@/components/AppShell";
import { PROTOCOLS, protocolBySlug } from "@/lib/protocols";
import { RecordForm, emptyValues, toPayload, type FormValues } from "@/components/RecordForm";
import { saveRecord } from "@/lib/offline";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/novo")({
  head: () => ({
    meta: [
      { title: "Novo registro de coleta — Observatorio Caiçara" },
      {
        name: "description",
        content:
          "Preencha o formulário dinâmico do protocolo escolhido e registre a coleta de campo, mesmo sem internet.",
      },
      { property: "og:title", content: "Novo registro de coleta — Observatorio Caiçara" },
      {
        property: "og:description",
        content: "Formulário dinâmico por protocolo para coleta de dados ambientais em campo.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NovoRegistro />
    </RequireAuth>
  ),
});

function NovoRegistro() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(PROTOCOLS[0]!.slug);
  const protocol = protocolBySlug(slug)!;
  const [values, setValues] = useState<FormValues>(() =>
    emptyValues(PROTOCOLS[0]!, profile?.nome ?? ""),
  );
  const [busy, setBusy] = useState(false);

  const changeProtocol = (next: string) => {
    const p = protocolBySlug(next)!;
    setSlug(next);
    setValues((prev) => ({ ...emptyValues(p, prev["pesquisador"] ?? ""), ...pickCommon(prev) }));
  };

  const submit = async () => {
    setBusy(true);
    try {
      const payload = { ...toPayload(protocol, values), user_id: user?.id };
      const result = await saveRecord(protocol.table, payload);
      if (result.synced) {
        toast.success("Registro salvo");
      } else {
        toast.info("Sem conexão: registro salvo no dispositivo e será sincronizado depois");
      }
      void queryClient.invalidateQueries();
      setValues(emptyValues(protocol, profile?.nome ?? ""));
      void navigate({ to: "/registros/$slug", params: { slug: protocol.slug } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Novo registro</h1>
        <p className="text-sm text-muted-foreground">
          Escolha o protocolo e preencha os campos da coleta.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PROTOCOLS.map((p) => (
          <Button
            key={p.slug}
            type="button"
            size="sm"
            variant={p.slug === slug ? "default" : "outline"}
            onClick={() => changeProtocol(p.slug)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <RecordForm
        protocol={protocol}
        values={values}
        onChange={setValues}
        onSubmit={() => void submit()}
        submitting={busy}
      />
    </div>
  );
}

function pickCommon(values: FormValues): FormValues {
  const keys = [
    "pesquisador",
    "local_pesquisa",
    "ambiente",
    "data_coleta",
    "hora_inicio",
    "hora_termino",
  ];
  const out: FormValues = {};
  keys.forEach((k) => (out[k] = values[k] ?? ""));
  return out;
}
