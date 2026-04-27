import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

type ItemRow = {
  id_item: number;
  nome: string | null;
  tipo: string | null;
  quantidade: number | null;
  validade: string | null;
  estoque_minimo: number | null;
};

type ListItensResponse = { ok: true; data: ItemRow[] };
type UpdateItemResponse = { ok: true; data: ItemRow };
type DeleteItemResponse = { ok: true; data: { id_item: number } };
type MovimentacaoResponse = { ok: true; data: unknown };

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isDateIso(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function AlmoxMovPage({ token }: { token: string }) {
  const [itens, setItens] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return itens;
    return itens.filter((it) => {
      const nome = (it.nome ?? "").toLowerCase();
      const tipo = (it.tipo ?? "").toLowerCase();
      return nome.includes(qq) || tipo.includes(qq) || String(it.id_item).includes(qq);
    });
  }, [itens, q]);

  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editQuantidade, setEditQuantidade] = useState("0");
  const [editValidade, setEditValidade] = useState("");
  const [editEstoqueMinimo, setEditEstoqueMinimo] = useState("0");

  const [movItemId, setMovItemId] = useState("");
  const [movTipo] = useState<"saida">("saida");
  const [movQuantidade, setMovQuantidade] = useState("1");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const resp = await apiGet<ListItensResponse>("/itens", token);
      setItens(resp.data ?? []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function iniciarEdicao(it: ItemRow) {
    setErr("");
    setEditingId(it.id_item);
    setEditNome(it.nome ?? "");
    setEditTipo(it.tipo ?? "");
    setEditValidade(it.validade ? String(it.validade).slice(0, 10) : "");
    setEditEstoqueMinimo(String(it.estoque_minimo ?? 0));
    setEditQuantidade(String(it.quantidade ?? 0));
  }

  function cancelarEdicao() {
    setEditingId(null);
    setEditNome("");
    setEditTipo("");
    setEditValidade("");
    setEditEstoqueMinimo("0");
    setEditQuantidade("0");
  }

  async function salvarEdicao() {
    if (!editingId) return;
    setErr("");

    const nomeValue = editNome.trim();
    const tipoValue = editTipo.trim();
    const estoqueMinimoNum = Number(editEstoqueMinimo);
    const quantidadeNum = Number(editQuantidade);

    if (!nomeValue) {
      setErr("Informe o nome do item");
      return;
    }

    if (!tipoValue) {
      setErr("Informe o tipo do item");
      return;
    }

    if (!Number.isFinite(estoqueMinimoNum) || estoqueMinimoNum < 0) {
      setErr("Informe um estoque minimo valido");
      return;
    }

    if (editValidade && !isDateIso(editValidade)) {
      setErr("Data de validade invalida. Use o formato YYYY-MM-DD");
      return;
    }

    setBusy(true);
    try {
      await apiPut<UpdateItemResponse>(`/itens/${editingId}`, token, {
        nome: nomeValue,
        tipo: tipoValue,
        validade: editValidade || null,
        estoque_minimo: estoqueMinimoNum,
        quantidade: quantidadeNum,
      });

      await load();
      cancelarEdicao();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function excluirItem(idItem: number, nomeItem: string | null) {
    const label = nomeItem?.trim() ? `${nomeItem} (#${idItem})` : `#${idItem}`;
    if (!window.confirm(`Deseja excluir o item ${label}?`)) return;
    setErr("");
    setBusy(true);
    try {
      await apiDelete<DeleteItemResponse>(`/itens/${idItem}`, token);
      await load();
      if (editingId === idItem) cancelarEdicao();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function registrarMovimentacao() {
    setErr("");

    const idItemNum = Number(movItemId);
    const quantidadeNum = Number(movQuantidade);

    if (!Number.isFinite(idItemNum) || idItemNum <= 0) {
      setErr("Selecione um item valido para movimentacao");
      return;
    }

    if (!Number.isFinite(quantidadeNum) || quantidadeNum <= 0) {
      setErr("Informe uma quantidade valida (maior que zero)");
      return;
    }

    setBusy(true);
    try {
      await apiPost<MovimentacaoResponse>("/movimentacoes", token, {
        id_item: idItemNum,
        tipo: movTipo,
        quantidade: quantidadeNum,
      });

      await load();
      setMovQuantidade("1");
      setMovItemId("");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Saída de Estoque</h2>

      {err && <div className="error">{err}</div>}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Registrar Saída</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          <select
            value={movItemId}
            onChange={(e) => setMovItemId(e.target.value)}
            disabled={busy}
            style={{ gridColumn: "1 / -1" }}
          >
            <option value="">Selecione o item</option>
            {itens.map((it) => (
              <option key={it.id_item} value={String(it.id_item)}>
                #{it.id_item} - {it.nome ?? "Sem nome"}
              </option>
            ))}
          </select>

          <input
            placeholder="quantidade"
            type="number"
            value={movQuantidade}
            maxLength={2}
            onChange={(e) => setMovQuantidade(e.target.value.replace(/\D/g, "").slice(0, 2))}
            disabled={busy}
          />

          <button onClick={registrarMovimentacao} disabled={busy} style={{ gridColumn: "1 / -1" }}>
            {busy ? "Processando..." : "Registrar Saída"}
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 16, marginBottom: 8 }}>Buscar Itens</h3>
      <div className="card" style={{ marginBottom: 16 }}>
        <input
          placeholder="buscar por id/nome/tipo"
          value={q}
          maxLength={30}
          onChange={(e) => setQ(e.target.value.slice(0, 30))}
          style={{ width: "100%" }}
        />
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Qtd</th>
              <th>Validade</th>
              <th>Est. min</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id_item}>
                <td>{it.id_item}</td>
                <td>
                  {editingId === it.id_item ? (
                    <input
                      value={editNome}
                      maxLength={30}
                      onChange={(e) => setEditNome(e.target.value.slice(0, 30))}
                      disabled={busy}
                    />
                  ) : (
                    it.nome ?? "-"
                  )}
                </td>
                <td>
                  {editingId === it.id_item ? (
                    <input
                      value={editTipo}
                      maxLength={20}
                      onChange={(e) => setEditTipo(e.target.value.slice(0, 20))}
                      disabled={busy}
                    />
                  ) : (
                    it.tipo ?? "-"
                  )}
                </td>
                <td>
                  {editingId === it.id_item ? (
                    <input
                      value={editQuantidade}
                      inputMode="numeric"
                      maxLength={3}
                      onChange={(e) => setEditQuantidade(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="quantidade"
                      style={{ width: 140 }}
                      disabled={busy}
                    />
                  ) : it.quantidade != null ? (
                    it.quantidade
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {editingId === it.id_item ? (
                    <input
                      value={editValidade}
                      inputMode="numeric"
                      maxLength={10}
                      onChange={(e) => setEditValidade(formatDateInput(e.target.value))}
                      placeholder="YYYY-MM-DD"
                      style={{ width: 140 }}
                      disabled={busy}
                    />
                  ) : it.validade ? (
                    String(it.validade).slice(0, 10)
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {editingId === it.id_item ? (
                    <input
                      value={editEstoqueMinimo}
                      inputMode="numeric"
                      maxLength={3}
                      onChange={(e) => setEditEstoqueMinimo(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      style={{ width: 80 }}
                      disabled={busy}
                    />
                  ) : (
                    it.estoque_minimo ?? "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
