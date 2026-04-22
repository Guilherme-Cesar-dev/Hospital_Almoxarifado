import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

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
  const [validade, setValidade] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [busy, setBusy] = useState(false);

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
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id_item}>
                <td>{it.id_item}</td>
                <td>{it.nome ?? "-"}</td>
                <td>{it.tipo ?? "-"}</td>
                <td>{it.quantidade ?? "-"}</td>
                <td>{it.validade ? String(it.validade).slice(0, 10) : "-"}</td>
                <td>{it.estoque_minimo ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 12 }}>
        Observação: esta tela usa <code>GET /itens</code> para listar e <code>POST /itens</code>
        para cadastrar item com os campos obrigatórios <code>nome</code> e <code>tipo</code>.
      </p>
    </div>
  );
}