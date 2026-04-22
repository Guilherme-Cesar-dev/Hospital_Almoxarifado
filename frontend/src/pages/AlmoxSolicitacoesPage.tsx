import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../lib/api";
import type { SolicitacaoListResponse } from "../types/solicitacoes";

type Estado = "pendente" | "atendida" | "cancelada" | "todas";

export function AlmoxSolicitacoesPage({ token }: { token: string }) {
  const nav = useNavigate();

  const [estado, setEstado] = useState<Estado>("todas");
  const [data, setData] = useState<SolicitacaoListResponse | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (estado !== "todas") q.set("estado", estado);
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [estado]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const resp = await apiGet<SolicitacaoListResponse>(`/solicitacoes${query}`, token);
      setData(resp);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((e) => setErr(String(e?.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, query]);

  return (
    <div>
      <h2>Solicitações (almox)</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Estado:</label>
        <select value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>
          <option value="todas">todas</option>
          <option value="pendente">pendente</option>
          <option value="atendida">atendida</option>
          <option value="cancelada">cancelada</option>
        </select>

        <button onClick={() => load().catch((e) => setErr(String(e?.message ?? e)))} disabled={loading}>
          {loading ? "Carregando..." : "Recarregar"}
        </button>
      </div>

      {!data ? (
        <div style={{ marginTop: 12 }}>{loading ? "Carregando…" : "Sem dados"}</div>
      ) : data.data.length === 0 ? (
        <div style={{ marginTop: 12 }}>Nenhuma solicitação</div>
      ) : (
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Setor</th>
              <th>Estado</th>
              <th>Quando</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((s) => (
              <tr key={s.id_solicitacao}>
                <td>{s.id_solicitacao}</td>
                <td>{s.titulo}</td>
                <td>{s.setor}</td>
                <td>{s.estado}</td>
                <td>{new Date(s.quando).toLocaleString()}</td>
                <td>
                  <button onClick={() => nav(`/solicitacoes/${s.id_solicitacao}`)}>Abrir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}