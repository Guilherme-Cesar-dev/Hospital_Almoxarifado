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
type CreateItemResponse = { ok: true; data: ItemRow };
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

export function InventarioPage({ token }: { token: string }) {
  const [itens, setItens] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filtros simples
  const [q, setQ] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "baixa" | "normal">("todos");
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return itens.filter((it) => {
      const nome = (it.nome ?? "").toLowerCase();
      const tipo = (it.tipo ?? "").toLowerCase();
      const textoOk = !qq || nome.includes(qq) || tipo.includes(qq) || String(it.id_item).includes(qq);

      const qtd = Number(it.quantidade ?? 0);
      const min = Number(it.estoque_minimo ?? 0);
      const emBaixa = Number.isFinite(qtd) && Number.isFinite(min) && qtd < min;
      const statusOk =
        statusFiltro === "todos" ||
        (statusFiltro === "baixa" && emBaixa) ||
        (statusFiltro === "normal" && !emBaixa);

      return textoOk && statusOk;
    });
  }, [itens, q, statusFiltro]);

  const itensAbaixoMinimo = useMemo(() => {
    return itens.filter((it) => {
      const qtd = Number(it.quantidade ?? 0);
      const min = Number(it.estoque_minimo ?? 0);
      if (!Number.isFinite(qtd) || !Number.isFinite(min)) return false;
      return qtd < min;
    });
  }, [itens]);

  // formulário de cadastro
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [quantidade, setQuantidade] = useState("0");
  const [validade, setValidade] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editValidade, setEditValidade] = useState("");
  const [editEstoqueMinimo, setEditEstoqueMinimo] = useState("0");

  // Entrada de estoque
  const [movItemId, setMovItemId] = useState("");
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

  async function cadastrarItem() {
    setErr("");

    const nomeValue = nome.trim();
    const tipoValue = tipo.trim();
    const estoqueMinimoNum = Number(estoqueMinimo);

    if (!nomeValue) {
      setErr("Informe o nome do item");
      return;
    }

    if (!tipoValue) {
      setErr("Informe o tipo do item");
      return;
    }

    if (!Number.isFinite(estoqueMinimoNum) || estoqueMinimoNum < 0) {
      setErr("Informe um estoque mínimo válido");
      return;
    }

    if (validade && !isDateIso(validade)) {
      setErr("Data de validade inválida. Use o formato YYYY-MM-DD");
      return;
    }

    setBusy(true);
    try {
      await apiPost<CreateItemResponse>("/itens", token, {
        nome: nomeValue,
        tipo: tipoValue,
        quantidade: Number(quantidade) || 0,
        validade: validade || null,
        estoque_minimo: estoqueMinimoNum,
      });

      // recarrega lista
      await load();

      // limpa form
      setNome("");
      setTipo("");
      setValidade("");
      setEstoqueMinimo("0");
      setQuantidade("0");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  function iniciarEdicao(it: ItemRow) {
    setErr("");
    setEditingId(it.id_item);
    setEditNome(it.nome ?? "");
    setEditTipo(it.tipo ?? "");
    setEditValidade(it.validade ? String(it.validade).slice(0, 10) : "");
    setEditEstoqueMinimo(String(it.estoque_minimo ?? 0));
  }

  function cancelarEdicao() {
    setEditingId(null);
    setEditNome("");
    setEditTipo("");
    setEditValidade("");
    setEditEstoqueMinimo("0");
  }

  async function salvarEdicao() {
    if (!editingId) return;
    setErr("");

    const nomeValue = editNome.trim();
    const tipoValue = editTipo.trim();
    const estoqueMinimoNum = Number(editEstoqueMinimo);

    if (!nomeValue) {
      setErr("Informe o nome do item");
      return;
    }

    if (!tipoValue) {
      setErr("Informe o tipo do item");
      return;
    }

    if (!Number.isFinite(estoqueMinimoNum) || estoqueMinimoNum < 0) {
      setErr("Informe um estoque mínimo válido");
      return;
    }

    if (editValidade && !isDateIso(editValidade)) {
      setErr("Data de validade inválida. Use o formato YYYY-MM-DD");
      return;
    }

    setBusy(true);
    try {
      await apiPut<UpdateItemResponse>(`/itens/${editingId}`, token, {
        nome: nomeValue,
        tipo: tipoValue,
        validade: editValidade || null,
        estoque_minimo: estoqueMinimoNum,
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

  async function fazerEntrada() {
    setErr("");
    const idItemNum = Number(movItemId);
    const quantidadeNum = Number(movQuantidade);

    if (!Number.isFinite(idItemNum) || idItemNum <= 0) {
      setErr("Selecione um item válido");
      return;
    }

    if (!Number.isFinite(quantidadeNum) || quantidadeNum <= 0) {
      setErr("Informe uma quantidade válida (maior que zero)");
      return;
    }

    setBusy(true);
    try {
      await apiPost<MovimentacaoResponse>("/movimentacoes", token, {
        id_item: idItemNum,
        tipo: "entrada",
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
      <h2>Inventário</h2>

      {err && <div className="error">{err}</div>}

      {itensAbaixoMinimo.length > 0 && (
        <div className="alert alert-warning">
          ⚠️ {itensAbaixoMinimo.length} item(ns) abaixo do estoque mínimo.
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Cadastrar Novo Item</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, alignItems: "end" }}>
          <input
            placeholder="nome"
            value={nome}
            maxLength={30}
            onChange={(e) => setNome(e.target.value.slice(0, 30))}
          />
          <input
            placeholder="tipo"
            value={tipo}
            maxLength={20}
            onChange={(e) => setTipo(e.target.value.slice(0, 20))}
          />
          <input
            placeholder="quantidade"
            value={quantidade}
            inputMode="numeric"
            maxLength={3}
            onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
          <input
            placeholder="validade (YYYY-MM-DD)"
            value={validade}
            inputMode="numeric"
            maxLength={10}
            onChange={(e) => setValidade(formatDateInput(e.target.value))}
          />
          <input
            placeholder="estoque mínimo"
            value={estoqueMinimo}
            inputMode="numeric"
            maxLength={3}
            onChange={(e) => setEstoqueMinimo(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
          <button onClick={cadastrarItem} disabled={busy}>
            {busy ? "Salvando..." : "Cadastrar Item"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Entrada de Estoque</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, alignItems: "end" }}>
          <select
            value={movItemId}
            onChange={(e) => setMovItemId(e.target.value)}
            disabled={busy}
          >
            <option value="">Selecione um item</option>
            {itens.map((it) => (
              <option key={it.id_item} value={it.id_item}>
                {it.nome} (#{it.id_item})
              </option>
            ))}
          </select>
          <input
            placeholder="quantidade"
            value={movQuantidade}
            inputMode="numeric"
            maxLength={3}
            onChange={(e) => setMovQuantidade(e.target.value.replace(/\D/g, "").slice(0, 3))}
            disabled={busy}
          />
          <button onClick={fazerEntrada} disabled={busy || !movItemId}>
            {busy ? "Registrando..." : "Registrar Entrada"}
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 16, marginBottom: 8 }}>Buscar Itens</h3>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, alignItems: "end" }}>
          <input
            placeholder="buscar por id/nome/tipo"
            value={q}
            maxLength={30}
            onChange={(e) => setQ(e.target.value.slice(0, 30))}
          />
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as "todos" | "baixa" | "normal")}>
            <option value="todos">Todos os status</option>
            <option value="baixa">Em baixa</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Qtd</th>
              <th>Validade</th>
              <th>Est. mín</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr
                key={it.id_item}
                style={
                  Number(it.quantidade ?? 0) < Number(it.estoque_minimo ?? 0)
                    ? { background: "#ffcece" }
                    : undefined
                }
              >
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
                  {it.quantidade != null ? (
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
                <td>
                  {editingId === it.id_item ? (
                    <>
                      <button onClick={salvarEdicao} disabled={busy}>Salvar</button>
                      <button onClick={cancelarEdicao} disabled={busy}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => iniciarEdicao(it)} disabled={busy}>Editar</button>
                      <button onClick={() => excluirItem(it.id_item, it.nome)} disabled={busy}>Excluir</button>
                    </>
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