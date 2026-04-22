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
  const [setor, setSetor] = useState("Enfermaria");
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
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {!createdId ? (
        <>
          <div>
            <label>Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label>Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <label>Setor</label>
            <input value={setor} onChange={(e) => setSetor(e.target.value)} />
          </div>

          <button onClick={() => criar().catch((e) => setErr(String(e.message ?? e)))}>
            Criar
          </button>
        </>
      ) : (
        <>
          <p>Criada: #{createdId}</p>

          <h3>Adicionar item</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={idItem}
              onChange={(e) => setIdItem(e.target.value)}
              disabled={itensLoading}
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
              onChange={(e) => setQtd(e.target.value)}
              style={{ width: 120 }}
            />
            <input
              placeholder="observação"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={() => addItem().catch((e) => setErr(String(e.message ?? e)))}>
              Adicionar
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => nav(`/solicitacoes/${createdId}`)}>Ver detalhe</button>
          </div>
        </>
      )}
    </div>
  );
}