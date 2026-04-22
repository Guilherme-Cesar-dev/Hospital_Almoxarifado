// name=src/pages/SolicitacaoDetalhePage.tsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import type { SolicitacaoDetalheResponse } from "../types/solicitacoes";

export function SolicitacaoDetalhePage({ token, id }: { token: string; id: number }) {
  const [data, setData] = useState<SolicitacaoDetalheResponse | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<null | "cancelar" | "atender">(null);

  async function load() {
    setErr("");
    const resp = await apiGet<SolicitacaoDetalheResponse>(`/solicitacoes/${id}`, token);
    setData(resp);
  }

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const estado = data?.data.solicitacao.estado ?? null;

  const podeCancelar = useMemo(() => estado === "pendente", [estado]);
  const podeAtender = useMemo(() => estado === "pendente", [estado]);

  async function onCancelar() {
    setBusy("cancelar");
    try {
      await apiPost(`/solicitacoes/${id}/cancelar`, token, {});
      await load();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  async function onAtender() {
    setBusy("atender");
    try {
      await apiPost(`/solicitacoes/${id}/atender`, token, {});
      await load();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  if (err) return <div>Erro: {err}</div>;
  if (!data) return <div>Carregando…</div>;

  const { solicitacao, itens } = data.data;

  return (
    <div>
      <h2>
        Solicitação #{solicitacao.id_solicitacao} — {solicitacao.titulo}
      </h2>

      <div>Estado: {solicitacao.estado}</div>
      <div>Setor: {solicitacao.setor}</div>
      <div>Quando: {new Date(solicitacao.quando).toLocaleString()}</div>

      <p>{solicitacao.descricao}</p>

      <div>
        <button onClick={onCancelar} disabled={!podeCancelar || busy !== null}>
          {busy === "cancelar" ? "Cancelando..." : "Cancelar"}
        </button>

        <button onClick={onAtender} disabled={!podeAtender || busy !== null}>
          {busy === "atender" ? "Atendendo..." : "Atender"}
        </button>

        <button onClick={() => load().catch((e) => setErr(String(e.message ?? e)))} disabled={busy !== null}>
          Recarregar
        </button>
      </div>

      <h3>Itens</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Tipo</th>
            <th>Solicitado</th>
            <th>Aprovado</th>
            <th>Estoque atual</th>
            <th>Obs</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((it) => (
            <tr key={it.id_solicitacao_item}>
              <td>{it.item.nome ?? `#${it.id_item}`}</td>
              <td>{it.item.tipo ?? "-"}</td>
              <td>{it.quantidade}</td>
              <td>{it.quantidade_aprovada ?? "-"}</td>
              <td>{it.item.quantidade_atual ?? "-"}</td>
              <td>{it.observacao ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Atendimento</h3>
      <pre>{JSON.stringify(solicitacao.atendimento_resumo, null, 2)}</pre>
    </div>
  );
}