import { useState } from "react";
import type { FieldDef, ProtocolDef } from "@/lib/protocols";
import { COMMON_FIELDS } from "@/lib/protocols";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type FormValues = Record<string, string>;

export function emptyValues(protocol: ProtocolDef, pesquisador = ""): FormValues {
  const values: FormValues = {
    pesquisador,
    local_pesquisa: "",
    ambiente: "",
    data_coleta: new Date().toISOString().slice(0, 10),
    hora_inicio: "",
    hora_termino: "",
  };
  protocol.fields.forEach((f) => (values[f.name] = ""));
  return values;
}

export function valuesFromRow(protocol: ProtocolDef, row: Record<string, unknown>): FormValues {
  const values = emptyValues(protocol);
  Object.keys(values).forEach((key) => {
    const v = row[key];
    values[key] = v === null || v === undefined ? "" : String(v);
  });
  return values;
}

/** Converts string form values into typed payload for the database. */
export function toPayload(protocol: ProtocolDef, values: FormValues): Record<string, unknown> {
  const get = (k: string) => (values[k] ?? "").trim();
  const payload: Record<string, unknown> = {
    pesquisador: get("pesquisador"),
    local_pesquisa: get("local_pesquisa"),
    ambiente: get("ambiente"),
    data_coleta: get("data_coleta"),
    hora_inicio: get("hora_inicio"),
    hora_termino: get("hora_termino"),
  };
  protocol.fields.forEach((f) => {
    const raw = (values[f.name] ?? "").trim();
    if (raw === "") {
      payload[f.name] = null;
    } else if (f.type === "int") {
      payload[f.name] = Math.trunc(Number(raw));
    } else if (f.type === "decimal") {
      payload[f.name] = Number(raw);
    } else {
      payload[f.name] = raw;
    }
  });
  return payload;
}

export function validate(protocol: ProtocolDef, values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const required: Array<[string, string]> = [
    ["pesquisador", "Informe o pesquisador"],
    ["local_pesquisa", "Informe o local de pesquisa"],
    ["ambiente", "Informe o ambiente"],
    ["data_coleta", "Informe a data da coleta"],
    ["hora_inicio", "Informe o horário de início"],
    ["hora_termino", "Informe o horário de término"],
  ];
  required.forEach(([key, msg]) => {
    if (!(values[key] ?? "").trim()) errors[key] = msg;
  });
  const dataColeta = values["data_coleta"] ?? "";
  const inicio = values["hora_inicio"] ?? "";
  const termino = values["hora_termino"] ?? "";
  if (dataColeta && Number.isNaN(Date.parse(dataColeta))) {
    errors["data_coleta"] = "Data inválida";
  }
  if (inicio && termino && termino < inicio) {
    errors["hora_termino"] = "O término deve ser após o início";
  }
  protocol.fields.forEach((f) => {
    const raw = (values[f.name] ?? "").trim();
    if (!raw) return;
    if (f.type === "int" || f.type === "decimal") {
      if (Number.isNaN(Number(raw))) errors[f.name] = "Use apenas números";
      else if (Number(raw) < 0) errors[f.name] = "Não pode ser negativo";
      else if (f.type === "int" && !Number.isInteger(Number(raw)))
        errors[f.name] = "Use um número inteiro";
    }
  });
  return errors;
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldDef;
  value: string;
  error?: string | undefined;
  onChange: (v: string) => void;
}) {
  const id = `field-${field.name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input
          id={id}
          type={field.type === "text" ? "text" : "number"}
          inputMode={field.type === "int" ? "numeric" : field.type === "decimal" ? "decimal" : "text"}
          step={field.type === "decimal" ? "0.01" : field.type === "int" ? "1" : undefined}
          min={field.type === "text" ? undefined : 0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function RecordForm({
  protocol,
  values,
  onChange,
  onSubmit,
  submitting,
  submitLabel = "Salvar registro",
}: {
  protocol: ProtocolDef;
  values: FormValues;
  onChange: (values: FormValues) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (name: string, v: string) => onChange({ ...values, [name]: v });

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const found = validate(protocol, values);
        setErrors(found);
        if (Object.keys(found).length === 0) onSubmit();
      }}
    >
      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dados da coleta
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMMON_FIELDS.map((f) => (
            <FieldInput
              key={f.name}
              field={f}
              value={values[f.name] ?? ""}
              error={errors[f.name]}
              onChange={(v) => set(f.name, v)}
            />
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="data_coleta">Data da coleta</Label>
            <Input
              id="data_coleta"
              type="date"
              value={values["data_coleta"]}
              onChange={(e) => set("data_coleta", e.target.value)}
            />
            {errors["data_coleta"] && <p className="text-xs text-destructive">{errors["data_coleta"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hora_inicio">Horário início</Label>
            <Input
              id="hora_inicio"
              type="time"
              value={values["hora_inicio"]}
              onChange={(e) => set("hora_inicio", e.target.value)}
            />
            {errors["hora_inicio"] && <p className="text-xs text-destructive">{errors["hora_inicio"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hora_termino">Horário término</Label>
            <Input
              id="hora_termino"
              type="time"
              value={values["hora_termino"]}
              onChange={(e) => set("hora_termino", e.target.value)}
            />
            {errors["hora_termino"] && (
              <p className="text-xs text-destructive">{errors["hora_termino"]}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {protocol.label}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {protocol.fields.map((f) => (
            <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
              <FieldInput
                field={f}
                value={values[f.name] ?? ""}
                error={errors[f.name]}
                onChange={(v) => set(f.name, v)}
              />
            </div>
          ))}
        </div>
      </section>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
