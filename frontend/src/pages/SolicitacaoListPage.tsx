import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "../lib/api";
import type { SolicitacaoListResponse } from "../types/solicitacoes";

export function SolicitacoesListPage({ token }: { token: string }) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<SolicitacaoListResponse | null>(null);
  const [err, setErr] = useState("");

  const estado = params.get("estado") ?? "";

  useEffect(() => {
    const id = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    apiGet<SolicitacaoListResponse>(`/solicitacoes${id}`, token)
      .then(setData)
      .catch((e) => setErr(String(e.message ?? e)));
  }, [token, estado]);

  return (
    <div>
      <h2>Solicitações</h2>

      <label>
        Estado:{" "}
        <select
          value={estado}
          onChange={(e) => {
            const v = e.target.value;
            setParams(v ? { estado: v } : {});
          }}
        >
          <option value="">(todas)</option>
          <option value="pendente">pendente</option>
          <option value="em_andamento">em_andamento</option>
          <option value="concluida">concluida</option>
          <option value="cancelada">cancelada</option>
        </select>
      </label>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!data ? (
        <p>Carregando…</p>
      ) : (
        <table style={{ width: "100%", marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Setor</th>
              <th>Estado</th>
              <th>Quando</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((s) => (
              <tr key={s.id_solicitacao}>
                <td>
                  <Link to={`/solicitacoes/${s.id_solicitacao}`}>{s.id_solicitacao}</Link>
                </td>
                <td>{s.titulo}</td>
                <td>{s.setor}</td>
                <td>{s.estado}</td>
                <td>{new Date(s.quando).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}