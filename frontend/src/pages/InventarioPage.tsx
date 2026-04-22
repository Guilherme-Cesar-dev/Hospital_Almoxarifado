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

export function InventarioPage({ token }: { token: string }) {
  const [itens, setItens] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filtros simples
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
  const [editQuantidade, setEditQuantidade] = useState("0");
  const [editValidade, setEditValidade] = useState("");
  const [editEstoqueMinimo, setEditEstoqueMinimo] = useState("0");

  // formulário de movimentação
  const [movItemId, setMovItemId] = useState("");
  const [movTipo, setMovTipo] = useState<"entrada" | "saida">("entrada");
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
      setErr("Informe um estoque mínimo válido");
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
      setErr("Selecione um item válido para movimentação");
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
        tipo: movTipo,
        quantidade: quantidadeNum,
      });

      await load();
      setMovQuantidade("1");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Inventário</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {itensAbaixoMinimo.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px solid #f4c542",
            background: "#fff7db",
            color: "#6b4f00",
          }}
        >
          Alerta: {itensAbaixoMinimo.length} item(ns) abaixo do estoque mínimo.
        </div>
      )}

      <h3>Cadastrar novo item</h3>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          placeholder="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />
        <input
          placeholder="quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        <input
          placeholder="validade (YYYY-MM-DD)"
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
          style={{ width: 190 }}
        />
        <input
          placeholder="estoque mínimo"
          value={estoqueMinimo}
          onChange={(e) => setEstoqueMinimo(e.target.value)}
          style={{ width: 160 }}
        />
        <button onClick={cadastrarItem} disabled={busy}>
          {busy ? "Salvando..." : "Cadastrar"}
        </button>
        <button onClick={() => load()} disabled={busy}>
          Recarregar
        </button>
      </div>

      <h3 style={{ marginTop: 16 }}>Movimentar estoque</h3>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={movItemId}
          onChange={(e) => setMovItemId(e.target.value)}
          style={{ minWidth: 260 }}
        >
          <option value="">Selecione o item</option>
          {itens.map((it) => (
            <option key={it.id_item} value={String(it.id_item)}>
              #{it.id_item} - {it.nome ?? "Sem nome"}
            </option>
          ))}
        </select>

        <select value={movTipo} onChange={(e) => setMovTipo(e.target.value as "entrada" | "saida") }>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <input
          placeholder="quantidade"
          value={movQuantidade}
          onChange={(e) => setMovQuantidade(e.target.value)}
          style={{ width: 140 }}
        />

        <button onClick={registrarMovimentacao} disabled={busy}>
          {busy ? "Processando..." : "Registrar movimentação"}
        </button>
      </div>

      <h3 style={{ marginTop: 16 }}>Itens</h3>
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="buscar por id/nome/tipo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      {loading ? (
        <div>Carregando…</div>
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
                    ? { background: "#fff1f1" }
                    : undefined
                }
              >
                <td>{it.id_item}</td>
                <td>
                  {editingId === it.id_item ? (
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
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
                      onChange={(e) => setEditTipo(e.target.value)}
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
                      onChange={(e) => setEditQuantidade(e.target.value)}
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
                      onChange={(e) => setEditValidade(e.target.value)}
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
                      onChange={(e) => setEditEstoqueMinimo(e.target.value)}
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