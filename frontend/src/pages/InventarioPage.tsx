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

  return (
    <div>
      <h2>Inventário</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

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
              <tr key={it.id_item}>
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
                  ) : it.quantidade ? (
                    String(it.quantidade).slice(0, 10)
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