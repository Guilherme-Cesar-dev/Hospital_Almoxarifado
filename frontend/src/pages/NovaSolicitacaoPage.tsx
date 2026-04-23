import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api";
import type {
  AddItemBody,
  CreateSolicitacaoBody,
  CreateSolicitacaoResponse,
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

export function NovaSolicitacaoPage({ token }: { token: string }) {
  const nav = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [setor, setSetor] = useState("");
  const [err, setErr] = useState("");

  const [createdId, setCreatedId] = useState<number | null>(null);

  // itens disponíveis (pra não digitar id na mão)
  const [itens, setItens] = useState<ItemRow[]>([]);
  const [itensLoading, setItensLoading] = useState(false);

  // item form
  const [idItem, setIdItem] = useState(""); // continua string (value do select)
  const [qtd, setQtd] = useState("1");
  const [obs, setObs] = useState("");

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
              <input value={titulo} maxLength={15} onChange={(e) => setTitulo(e.target.value.slice(0, 15))} />
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
              <select
                value={idItem}
                onChange={(e) => setIdItem(e.target.value)}
                disabled={itensLoading}
                style={{ gridColumn: "1 / -1" }}
              >
                <option value="">
                  {itensLoading ? "Carregando itens..." : "Selecione um item"}
                </option>
                {itens.map((it) => (
                  <option key={it.id_item} value={String(it.id_item)}>
                    {(it.nome ?? `ITEM #${it.id_item}`) + ` (#{it.id_item})`}
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
          </div>
        </>
      )}
    </div>
  );
}