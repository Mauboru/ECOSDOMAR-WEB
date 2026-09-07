/**
 * api.ts — Serviço centralizado para comunicação com a ECOSDOMAR-API.
 *
 * Base URL configurada via variável de ambiente VITE_API_URL.
 * Em desenvolvimento, o Vite faz proxy de /api → http://localhost:3001/api,
 * então podemos usar '/api' como base URL relativa.
 */

const BASE_URL: string = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "/api";
const TOKEN_KEY = "ecosdomar-token";

// ─── Token helpers ────────────────────────────────────────────────

export function getToken(): string | null {
  return typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

/** Decodifica o payload do JWT (sem validar assinatura). */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

// ─── Fetch base ───────────────────────────────────────────────────

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = (await res.json()) as { error?: string; message?: string };
      msg = json.error ?? json.message ?? msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  // 204 No Content — retorna undefined
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────

interface AuthResponse {
  token: string;
  user: Record<string, unknown>;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>("POST", "/auth/login", { email, password });
  setToken(data.token);
  return data;
}

export async function register(
  email: string,
  password: string,
  nome?: string,
  instituicao?: string,
): Promise<AuthResponse> {
  const data = await request<AuthResponse>("POST", "/auth/register", {
    email,
    password,
    nome,
    instituicao,
  });
  setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  clearToken();
}

// ─── Registros (CRUD por tabela de protocolo) ─────────────────────

export type ApiRecord = Record<string, unknown>;

/**
 * Busca todos os registros de uma tabela.
 * @param tabela — ex: 'carcinofauna', 'avifauna', etc.
 */
export async function fetchRecords(tabela: string): Promise<ApiRecord[]> {
  return request<ApiRecord[]>("GET", `/registros/${tabela}`);
}

/**
 * Insere um novo registro.
 */
export async function insertRecord(
  tabela: string,
  values: Record<string, unknown>,
): Promise<{ id: number | string; message: string }> {
  return request("POST", `/registros/${tabela}`, values);
}

/**
 * Atualiza um registro existente.
 */
export async function updateRecord(
  tabela: string,
  id: string | number,
  values: Record<string, unknown>,
): Promise<{ message: string }> {
  return request("PUT", `/registros/${tabela}/${id}`, values);
}

/**
 * Remove um registro.
 */
export async function deleteRecord(
  tabela: string,
  id: string | number,
): Promise<{ message: string }> {
  return request("DELETE", `/registros/${tabela}/${id}`);
}

// ─── fetchAll ────────────────────────────────────────────────────

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

interface ProtocolRef {
  slug: string;
  table: string;
  label: string;
  categoryField?: string;
  fields: { name: string }[];
}

/**
 * Busca registros de TODAS as tabelas de protocolo em paralelo.
 * Retorna array normalizado com campos comuns + slug/label do protocolo.
 */
export async function fetchAll(protocols: ProtocolRef[]): Promise<SummaryRow[]> {
  const results = await Promise.all(
    protocols.map(async (p) => {
      try {
        const rows = await fetchRecords(p.table);
        return rows.map<SummaryRow>((row) => ({
          id: String(row["id"] ?? ""),
          protocolSlug: p.slug,
          protocolLabel: p.label,
          pesquisador: String(row["pesquisador"] ?? ""),
          local_pesquisa: String(row["local_pesquisa"] ?? ""),
          ambiente: String(row["ambiente"] ?? ""),
          data_coleta: String(row["data_coleta"] ?? ""),
          created_at: String(row["created_at"] ?? ""),
          categoria: p.categoryField ? ((row[p.categoryField] as string | null) ?? null) : null,
          quantidade: row["quantidade"] != null ? Number(row["quantidade"]) : null,
        }));
      } catch {
        // Se o banco não estiver configurado, retorna vazio para esse protocolo
        return [] as SummaryRow[];
      }
    }),
  );
  return results.flat();
}
