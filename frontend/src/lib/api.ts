/**
 * ARQUIVO: api.ts
 * DESCRIÇÃO: Wrapper de funções HTTP para comunicação com backend
 * FUNCIONALIDADES:
 *   - Abstrai chamadas fetch com autenticação JWT
 *   - Trata erros e respostas JSON automaticamente
 *   - Suporta GET, POST, PUT e DELETE
 *   - Baseado na URL do servidor (VITE_API_BASE)
 * 
 * FUNÇÕES:
 *   - apiGet<T>(path, token): Requisição GET com tipo genérico
 *   - apiPost<T>(path, token, body?): Requisição POST com corpo JSON
 *   - apiPut<T>(path, token, body?): Requisição PUT com corpo JSON
 *   - apiDelete<T>(path, token): Requisição DELETE
 */

const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:3000";

type ApiError = { error?: string };

async function parseJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = (await parseJsonSafe(res)) as T & ApiError;
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return json as T;
}

export async function apiPost<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });

  const json = (await parseJsonSafe(res)) as T & ApiError;
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return json as T;
}

export async function apiPut<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });

  const json = (await parseJsonSafe(res)) as T & ApiError;
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return json as T;
}

export async function apiDelete<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = (await parseJsonSafe(res)) as T & ApiError;
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return json as T;
}