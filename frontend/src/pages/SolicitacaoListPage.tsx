import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiDelete, apiGet } from "../lib/api";
import type { SolicitacaoListResponse } from "../types/solicitacoes";

type DeleteSolicitacaoResponse = { ok: true; data: { id_solicitacao: number } };

export function SolicitacoesListPage({ token }: { token: string }) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<SolicitacaoListResponse | null>(null);
  const [err, setErr] = useState("");
  const [busyDeleteId, setBusyDeleteId] = useState<number | null>(null);

  const estado = params.get("estado") ?? "";

  async function load() {
    const id = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const resp = await apiGet<SolicitacaoListResponse>(`/solicitacoes${id}`, token);
    setData(resp);
  }

  useEffect(() => {
    setErr("");
    load()
      .catch((e) => setErr(String(e.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, estado]);

  async function excluirSolicitacao(idSolicitacao: number, titulo: string, estadoSolicitacao: string) {
    if (estadoSolicitacao !== "pendente") {
      setErr("Só é possível excluir solicitação pendente");
      return;
    }

    if (!window.confirm(`Deseja excluir a solicitação #${idSolicitacao} (${titulo})?`)) return;

    setErr("");
    setBusyDeleteId(idSolicitacao);
    try {
      await apiDelete<DeleteSolicitacaoResponse>(`/solicitacoes/${idSolicitacao}`, token);
      await load();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusyDeleteId(null);
    }
  }

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
        <div className="loading">Carregando solicitações...</div>
      ) : (
        <table style={{ width: "100%", marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Setor / Cpf</th>
              <th>Estado</th>
              <th>Quando</th>
              <th>Ações</th>
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
                <td>
                  <button
                    onClick={() => excluirSolicitacao(s.id_solicitacao, s.titulo, s.estado)}
                    disabled={busyDeleteId !== null || s.estado !== "pendente"}
                  >
                    {busyDeleteId === s.id_solicitacao ? "Excluindo..." : "Excluir"}
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