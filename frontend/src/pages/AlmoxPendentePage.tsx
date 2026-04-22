import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api";
import type { SolicitacaoListResponse } from "../types/solicitacoes";

export function AlmoxPendentesPage({ token }: { token: string }) {
  const [data, setData] = useState<SolicitacaoListResponse | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const resp = await apiGet<SolicitacaoListResponse>("/solicitacoes?estado=pendente", token);
      setData(resp);
    } catch (e) {
      setErr(String((e as Error)?.message ?? e));
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function atender(id: number) {
    setErr("");
    await apiPost(`/solicitacoes/${id}/atender`, token, {});
    await load();
  }

  return (
    <div>
      <h2>Almox — Pendentes</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!data ? (
        <p>Carregando…</p>
      ) : data.data.length === 0 ? (
        <p>Nenhuma pendente.</p>
      ) : (
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Setor</th>
              <th>Quando</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((s) => (
              <tr key={s.id_solicitacao}>
                <td><Link to={`/solicitacoes/${s.id_solicitacao}`}>{s.id_solicitacao}</Link></td>
                <td>{s.titulo}</td>
                <td>{s.setor}</td>
                <td>{new Date(s.quando).toLocaleString()}</td>
                <td>
                  <button onClick={() => atender(s.id_solicitacao).catch((e) => setErr(String(e.message ?? e)))}>
                    Atender
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}