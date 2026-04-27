import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api";
import type {
  AddItemBody,
  CreateSolicitacaoBody,
  CreateSolicitacaoResponse,
  SolicitacaoDetalheResponse,
} from "../types/solicitacoes";

type ItemRow = {
  id_item: number;
  nome: string | null;
  tipo?: string | null;
  quantidade?: number | null;
  validade?: string | null;
  estoque_minimo?: number | null;
};

type ItensResponse = { ok: true; data: ItemRow[] };

type ItemAdicionado = {
  id_solicitacao_item: number;
  id_item: number;
  nome: string;
  quantidade: number;
  observacao: string;
};

export function NovaSolicitacaoPage({ token }: { token: string }) {
  const nav = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [setor, setSetor] = useState("");
  const [err, setErr] = useState("");

  const [createdId, setCreatedId] = useState<number | null>(null);
  const [itensAdicionados, setItensAdicionados] = useState<ItemAdicionado[]>([]);

  // itens disponíveis (pra não digitar id na mão)
  const [itens, setItens] = useState<ItemRow[]>([]);
  const [itensLoading, setItensLoading] = useState(false);

  // item form
  const [idItem, setIdItem] = useState(""); // continua string (value do select)
  const [buscaItem, setBuscaItem] = useState("");
  const [qtd, setQtd] = useState("1");
  const [obs, setObs] = useState("");

  const itensFiltrados = itens.filter((it) => {
    const termo = buscaItem.trim().toLowerCase();
    if (!termo) return true;
    const nome = (it.nome ?? "").toLowerCase();
    const id = String(it.id_item);
    return nome.includes(termo) || id.includes(termo);
  });

  useEffect(() => {
    setErr("");
    setItensLoading(true);

    apiGet<ItensResponse>("/itens", token)
      .then((resp) => setItens(resp.data ?? []))
      .catch((e) => setErr(String(e.message ?? e)))
      .finally(() => setItensLoading(false));
  }, [token]);

  async function criar() {
    setErr("");
    const body: CreateSolicitacaoBody = { titulo, descricao, setor };
    const resp = await apiPost<CreateSolicitacaoResponse>("/solicitacoes", token, body);
    setCreatedId(resp.data.id_solicitacao);
    setItensAdicionados([]);
  }

  async function carregarItensSolicitacao(idSolicitacao: number) {
    const resp = await apiGet<SolicitacaoDetalheResponse>(`/solicitacoes/${idSolicitacao}`, token);
    const itens = resp.data.itens.map((it) => ({
      id_solicitacao_item: it.id_solicitacao_item,
      id_item: it.id_item,
      nome: it.item.nome ?? `ITEM #${it.id_item}`,
      quantidade: it.quantidade,
      observacao: it.observacao ?? "",
    }));

    setItensAdicionados(itens);
  }

  async function addItem() {
    if (!createdId) return;
    setErr("");

    if (!idItem) {
      setErr("Selecione um item");
      return;
    }

    const body: AddItemBody = {
      id_item: Number(idItem),
      quantidade: Number(qtd),
      observacao: obs || undefined,
    };

    await apiPost(`/solicitacoes/${createdId}/itens`, token, body);

    await carregarItensSolicitacao(createdId);

    // limpa
    setIdItem("");
    setQtd("1");
    setObs("");
  }

  return (
    <div>
      <h2>Nova Solicitação</h2>
      {err && <div className="error">{err}</div>}

      {!createdId ? (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Dados da Solicitação</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label>Título</label>
              <input value={titulo} maxLength={60} onChange={(e) => setTitulo(e.target.value.slice(0, 60))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label>Setor / Cpf</label>
              <input value={setor} maxLength={30} onChange={(e) => setSetor(e.target.value.slice(0, 30))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1 / -1" }}>
              <label>Descrição</label>
              <textarea value={descricao} maxLength={300} onChange={(e) => setDescricao(e.target.value.slice(0, 300))} rows={4} />
            </div>
            <button
              onClick={() => criar().catch((e) => setErr(String(e.message ?? e)))}
              style={{ gridColumn: "1 / -1" }}
            >
              Criar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="success">Solicitação criada com sucesso: #{createdId}</div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Adicionar Item</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
              <input
                placeholder="Buscar item por nome ou ID"
                value={buscaItem}
                maxLength={30}
                onChange={(e) => setBuscaItem(e.target.value.slice(0, 30))}
                style={{ gridColumn: "1 / -1" }}
              />

              <select
                value={idItem}
                onChange={(e) => setIdItem(e.target.value)}
                disabled={itensLoading}
                style={{ gridColumn: "1 / -1" }}
              >
                <option value="">
                  {itensLoading ? "Carregando itens..." : "Selecione um item"}
                </option>
                {itensFiltrados.map((it) => (
                  <option key={it.id_item} value={String(it.id_item)}>
                    {`#${it.id_item} - ${it.nome ?? "ITEM sem nome"}`}
                  </option>
                ))}
              </select>

              <input
                placeholder="quantidade"
                value={qtd}
                inputMode="numeric"
                maxLength={2}
                onChange={(e) => setQtd(e.target.value.replace(/\D/g, "").slice(0, 2))}
              />
              <input
                placeholder="observação"
                value={obs}
                maxLength={70}
                onChange={(e) => setObs(e.target.value.slice(0, 70))}
                style={{ gridColumn: "1 / -1" }}
              />
              <button
                onClick={() => addItem().catch((e) => setErr(String(e.message ?? e)))}
                style={{ gridColumn: "1 / -1" }}
              >
                Adicionar
              </button>

              <button onClick={() => nav(`/solicitacoes/${createdId}`)} style={{ gridColumn: "1 / -1" }}>
                Ver detalhe
              </button>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Itens adicionados</h3>
              {itensAdicionados.length === 0 ? (
                <p style={{ color: "#666" }}>Nenhum item adicionado ainda.</p>
              ) : (
                <table style={{ width: "100%", marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantidade</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensAdicionados.map((it) => (
                      <tr key={it.id_solicitacao_item}>
                        <td>{`#${it.id_item} - ${it.nome}`}</td>
                        <td>{it.quantidade}</td>
                        <td>{it.observacao || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}