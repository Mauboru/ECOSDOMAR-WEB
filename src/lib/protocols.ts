export type FieldType = "text" | "textarea" | "int" | "decimal";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
}

export interface ProtocolDef {
  slug: string;
  table: string;
  label: string;
  /** Field used for "quantity by category" charts */
  categoryField?: string;
  fields: FieldDef[];
}

export const COMMON_FIELDS: FieldDef[] = [
  { name: "pesquisador", label: "Pesquisador", type: "text" },
  { name: "local_pesquisa", label: "Local de pesquisa", type: "text" },
  { name: "ambiente", label: "Ambiente", type: "text" },
];

export const PROTOCOLS: ProtocolDef[] = [
  {
    slug: "carcinofauna",
    table: "carcinofauna",
    label: "Carcinofauna",
    categoryField: "especie",
    fields: [
      { name: "especie", label: "Espécie", type: "text" },
      { name: "nomenclatura", label: "Nomenclatura", type: "text" },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "origem", label: "Origem", type: "text" },
      { name: "quantidade", label: "Quantidade", type: "int" },
      { name: "tamanho_toca_cm", label: "Tamanho da toca (cm)", type: "decimal" },
    ],
  },
  {
    slug: "qualidade-agua",
    table: "qualidade_agua",
    label: "Qualidade da Água",
    categoryField: "classe_conama",
    fields: [
      { name: "classe_conama", label: "Classe CONAMA", type: "text" },
      { name: "condicoes_climaticas", label: "Condições climáticas", type: "text" },
      { name: "temperatura_agua", label: "Temperatura da água (°C)", type: "decimal" },
      { name: "turbidez", label: "Turbidez (NTU)", type: "decimal" },
      { name: "ph", label: "pH", type: "decimal" },
      { name: "salinidade", label: "Salinidade (‰)", type: "decimal" },
      { name: "nitrito", label: "Nitrito (mg/L)", type: "decimal" },
      { name: "amonia", label: "Amônia (mg/L)", type: "decimal" },
      { name: "oxigenio_dissolvido", label: "Oxigênio dissolvido (mg/L)", type: "decimal" },
    ],
  },
  {
    slug: "avifauna",
    table: "avifauna",
    label: "Avifauna",
    categoryField: "especie",
    fields: [
      { name: "especie", label: "Espécie", type: "text" },
      { name: "nomenclatura", label: "Nomenclatura", type: "text" },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "quantidade", label: "Quantidade", type: "int" },
      { name: "vivos", label: "Vivos", type: "int" },
      { name: "mortos", label: "Mortos", type: "int" },
    ],
  },
  {
    slug: "especies-exoticas",
    table: "especies_exoticas",
    label: "Espécies Exóticas",
    categoryField: "especie",
    fields: [
      { name: "especie", label: "Espécie", type: "text" },
      { name: "nomenclatura", label: "Nomenclatura", type: "text" },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "quantidade", label: "Quantidade", type: "int" },
    ],
  },
  {
    slug: "macrolixo",
    table: "macrolixo",
    label: "Macrolixo",
    categoryField: "tipo",
    fields: [
      { name: "tipo", label: "Tipo", type: "text" },
      { name: "quantidade", label: "Quantidade", type: "int" },
    ],
  },
  {
    slug: "vegetacao",
    table: "vegetacao",
    label: "Vegetação",
    categoryField: "tipo",
    fields: [
      { name: "tipo", label: "Tipo", type: "text" },
      { name: "nomenclatura", label: "Nomenclatura", type: "text" },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "quantidade", label: "Quantidade", type: "int" },
    ],
  },
  {
    slug: "peixes",
    table: "peixes",
    label: "Peixes",
    categoryField: "especie",
    fields: [
      { name: "especie", label: "Espécie", type: "text" },
      { name: "nomenclatura", label: "Nomenclatura", type: "text" },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "tamanho_cm", label: "Tamanho (cm)", type: "decimal" },
      { name: "quantidade", label: "Quantidade", type: "int" },
    ],
  },
  {
    slug: "paisagem",
    table: "paisagem",
    label: "Paisagem",
    categoryField: "caracteristicas",
    fields: [
      { name: "caracteristicas", label: "Características", type: "textarea" },
      { name: "quantidade", label: "Quantidade", type: "int" },
    ],
  },
  {
    slug: "ar",
    table: "ar",
    label: "Ar",
    fields: [{ name: "observacoes", label: "Observações", type: "textarea" }],
  },
  {
    slug: "restinga",
    table: "restinga",
    label: "Restinga",
    categoryField: "tipo",
    fields: [
      { name: "tipo", label: "Tipo", type: "text" },
      { name: "nomenclatura", label: "Nomenclatura", type: "text" },
      { name: "animal", label: "Animal", type: "text" },
      { name: "ecossistema", label: "Ecossistema", type: "text" },
      { name: "residuos_encontrados", label: "Resíduos encontrados", type: "textarea" },
      { name: "quantidade", label: "Quantidade", type: "int" },
      { name: "quantidade_residuos", label: "Quantidade de resíduos", type: "int" },
      { name: "tamanho_maior_cm", label: "Tamanho maior (cm)", type: "decimal" },
      { name: "tamanho_menor_cm", label: "Tamanho menor (cm)", type: "decimal" },
    ],
  },
];

export function protocolBySlug(slug: string): ProtocolDef | undefined {
  return PROTOCOLS.find((p) => p.slug === slug);
}

export const ALL_COLUMNS = (p: ProtocolDef): FieldDef[] => [
  ...COMMON_FIELDS,
  { name: "data_coleta", label: "Data da coleta", type: "text" },
  { name: "hora_inicio", label: "Horário início", type: "text" },
  { name: "hora_termino", label: "Horário término", type: "text" },
  ...p.fields,
];
