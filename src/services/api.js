/**
 * api.js — Serviço centralizado para comunicação com a ECOSDOMAR-API.
 *
 * Base URL configurada via variável de ambiente VITE_API_URL.
 * Em desenvolvimento, o Vite faz proxy de /api → http://localhost:3001/api
 * então podemos usar '/api' como base URL relativa.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "ecosdomar-token";

// ─── Token helpers ────────────────────────────────────────────────

export function getToken() {
  return typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

/** Decodifica o payload do JWT (sem validar assinatura). */
export function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

// ─── Fetch base ───────────────────────────────────────────────────

async function request(method, path, body) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      msg = json.error ?? json.message ?? msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  // 204 No Content — retorna vazio
  if (res.status === 204) return null;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────

export async function login(email, password) {
  const data = await request("POST", "/auth/login", { email, password });
  setToken(data.token);
  return data;
}

export async function register(email, password, nome, instituicao) {
  const data = await request("POST", "/auth/register", { email, password, nome, instituicao });
  setToken(data.token);
  return data;
}

export async function logout() {
  clearToken();
}

// ─── Registros (CRUD por tabela de protocolo) ─────────────────────

/**
 * Busca todos os registros de uma tabela.
 * @param {string} tabela — ex: 'carcinofauna', 'avifauna', etc.
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function fetchRecords(tabela) {
  return request("GET", `/registros/${tabela}`);
}

/**
 * Insere um novo registro.
 * @param {string} tabela
 * @param {Record<string, unknown>} values
 */
export async function insertRecord(tabela, values) {
  return request("POST", `/registros/${tabela}`, values);
}

/**
 * Atualiza um registro existente.
 * @param {string} tabela
 * @param {string|number} id
 * @param {Record<string, unknown>} values
 */
export async function updateRecord(tabela, id, values) {
  return request("PUT", `/registros/${tabela}/${id}`, values);
}

/**
 * Remove um registro.
 * @param {string} tabela
 * @param {string|number} id
 */
export async function deleteRecord(tabela, id) {
  return request("DELETE", `/registros/${tabela}/${id}`);
}

/**
 * Busca registros de TODAS as tabelas de protocolo em paralelo.
 * Retorna array normalizado com campos comuns + slug/label do protocolo.
 * @param {Array<{slug: string, table: string, label: string, categoryField?: string, fields: Array}>} protocols
 */
export async function fetchAll(protocols) {
  const results = await Promise.all(
    protocols.map(async (p) => {
      try {
        const rows = await fetchRecords(p.table);
        return (rows ?? []).map((row) => ({
          id: String(row["id"] ?? ""),
          protocolSlug: p.slug,
          protocolLabel: p.label,
          pesquisador: String(row["pesquisador"] ?? ""),
          local_pesquisa: String(row["local_pesquisa"] ?? ""),
          ambiente: String(row["ambiente"] ?? ""),
          data_coleta: String(row["data_coleta"] ?? ""),
          created_at: String(row["created_at"] ?? ""),
          categoria: p.categoryField ? (row[p.categoryField] ?? null) : null,
          quantidade: row["quantidade"] != null ? Number(row["quantidade"]) : null,
        }));
      } catch {
        // Se o banco não estiver configurado, retorna vazio para esse protocolo
        return [];
      }
    }),
  );
  return results.flat();
}
