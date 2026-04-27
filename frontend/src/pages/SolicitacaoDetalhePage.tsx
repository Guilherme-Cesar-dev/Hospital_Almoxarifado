// name=src/pages/SolicitacaoDetalhePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiDelete, apiGet, apiPost } from "../lib/api";
import { apiPut } from "../lib/api";
import { useUserRole } from "../hooks/useUserRole";
import type { SolicitacaoDetalheResponse } from "../types/solicitacoes";

export function SolicitacaoDetalhePage({ token, id }: { token: string; id: number }) {
  const nav = useNavigate();
  const [data, setData] = useState<SolicitacaoDetalheResponse | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<null | "cancelar" | "atender" | "excluir">(null);
  const { role } = useUserRole();

  const [aprovacoes, setAprovacoes] = useState<Record<number, string>>({});

  async function load() {
    setErr("");
    const resp = await apiGet<SolicitacaoDetalheResponse>(`/solicitacoes/${id}`, token);
    setData(resp);
    // popula aprovacoes iniciais
    const map: Record<number, string> = {};
    (resp.data.itens ?? []).forEach((it) => {
      map[it.id_solicitacao_item] = String(it.quantidade_aprovada ?? it.quantidade ?? 0);
    });
    setAprovacoes(map);
  }

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const estado = data?.data.solicitacao.estado ?? null;

  // Itens com saldo insuficiente para a quantidade solicitada
  const insuficientes = useMemo(() => {
    if (!data) return [] as Array<{ id_item: number; nome: string | null; atual: number; necessario: number }>;
    return data.data.itens
      .map((it) => {
        const atual = Number(it.item.quantidade_atual ?? 0);
        const necessario = Number(it.quantidade ?? 0);
        return { id_item: it.id_item, nome: it.item.nome ?? null, atual, necessario };
      })
      .filter((it) => Number.isFinite(it.atual) && it.atual < it.necessario);
  }, [data]);

  const podeCancelar = useMemo(() => estado === "pendente", [estado]);
  const podeAtender = useMemo(() => estado === "pendente" && insuficientes.length === 0, [estado, insuficientes]);
  const podeExcluir = useMemo(() => estado === "pendente", [estado]);
  const podeAtenderAcao = role === "almox_m" || role === "adm";
  const podeVerEstoque = role !== "solicitante";

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

  async function onExcluir() {
    if (!data) return;
    if (!window.confirm(`Deseja excluir a solicitação #${id} (${data.data.solicitacao.titulo})?`)) return;

    setBusy("excluir");
    try {
      await apiDelete(`/solicitacoes/${id}`, token);
      nav("/", { replace: true });
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setBusy(null);
    }
  }

  async function salvarAprovacao(idSolicitacaoItem: number) {
    if (!data) return;
    const value = aprovacoes[idSolicitacaoItem];
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      setErr("Informe uma quantidade aprovada válida");
      return;
    }

    try {
      await apiPut(`/solicitacoes/${id}/itens/${idSolicitacaoItem}`, token, { quantidade_aprovada: num });
      await load();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  if (err) return <div>Erro: {err}</div>;
  if (!data) return <div className="loading-screen">Carregando detalhes da solicitação...</div>;

  const { solicitacao, itens } = data.data;
  const atendidaPor = solicitacao.concluida_por_nome?.trim() || solicitacao.concluida_por || "Atendimento registrado";

  return (
    <div>
      <h2>
        Solicitação #{solicitacao.id_solicitacao} — {solicitacao.titulo}
      </h2>

      <div>Estado: {solicitacao.estado}</div>
      <div>Setor / Cpf: {solicitacao.setor}</div>
      <div>Quando: {new Date(solicitacao.quando).toLocaleString()}</div>

      <p>{solicitacao.descricao}</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {role !== "solicitante" && insuficientes.length > 0 && (
          <div style={{ color: "crimson", marginBottom: 8 }}>
            ⚠️ Itens sem estoque suficiente:
            <ul>
              {insuficientes.map((it) => (
                <li key={it.id_item}>
                  {it.nome ?? `#${it.id_item}`} — atual: {it.atual}, necessário: {it.necessario}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={onCancelar} disabled={!podeCancelar || busy !== null}>
          {busy === "cancelar" ? "Cancelando..." : "Cancelar"}
        </button>

        {podeAtenderAcao && (
          <button onClick={onAtender} disabled={!podeAtender || busy !== null}>
            {busy === "atender" ? "Atendendo..." : "Atender"}
          </button>
        )}

        {role !== "almox_m" && (
          <button onClick={onExcluir} disabled={!podeExcluir || busy !== null}>
            {busy === "excluir" ? "Excluindo..." : "Excluir"}
          </button>
        )}

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
            {podeVerEstoque && <th>Estoque atual</th>}
            {podeVerEstoque && <th>Status</th>}
            <th>Obs</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((it) => (
              <tr key={it.id_solicitacao_item}>
              <td>{it.item.nome ?? `#${it.id_item}`}</td>
              <td>{it.item.tipo ?? "-"}</td>
              <td>{it.quantidade}</td>
              <td>
                {((role === "almox_m" || role === "adm") && solicitacao.estado === "pendente") ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={aprovacoes[it.id_solicitacao_item] ?? String(it.quantidade_aprovada ?? it.quantidade ?? 0)}
                      onChange={(e) => setAprovacoes({ ...aprovacoes, [it.id_solicitacao_item]: e.target.value.replace(/\D/g, "") })}
                      style={{ width: 80 }}
                      disabled={busy !== null}
                    />
                    <button onClick={() => salvarAprovacao(it.id_solicitacao_item)} disabled={busy !== null}>
                      Salvar
                    </button>
                  </div>
                ) : (
                  (it.quantidade_aprovada ?? "-")
                )}
              </td>
              {podeVerEstoque && <td>{it.item.quantidade_atual ?? "-"}</td>}
              {podeVerEstoque && (
                <td>
                  {Number(it.item.quantidade_atual ?? 0) < Number(it.quantidade ?? 0) ? (
                    <span style={{ color: "crimson" }}>
                      Saldo insuficiente (atual: {it.item.quantidade_atual ?? 0}, necessário: {it.quantidade})
                    </span>
                  ) : (
                    <span style={{ color: "green" }}>OK</span>
                  )}
                </td>
              )}
              <td>{it.observacao ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Como foi atendida</h3>
      {solicitacao.concluida_em || solicitacao.concluida_por ? (
        <div style={{ border: "1px solid #dbe7f5", borderRadius: 12, padding: 16, background: "#f7fbff" }}>
          <div><strong>Atendida por:</strong> {atendidaPor}</div>
          {solicitacao.concluida_em && <div><strong>Atendida em:</strong> {new Date(solicitacao.concluida_em).toLocaleString()}</div>}
        </div>
      ) : (
        <p style={{ color: "#607084" }}>Aqui você vê quem cuidou da solicitação e quando ela foi finalizada.</p>
      )}
    </div>
  );
}