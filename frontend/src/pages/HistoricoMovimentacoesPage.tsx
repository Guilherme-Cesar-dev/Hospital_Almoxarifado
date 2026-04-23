import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../lib/api";

type MovimentacaoRow = {
  id_movimentacao?: number;
  id_item: number;
  nome_item?: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  data_movimentacao?: string;
  criado_em?: string;
};

type ListMovimentacoesResponse = { ok: true; data: MovimentacaoRow[] };

export function HistoricoMovimentacoesPage({ token }: { token: string }) {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filtros
  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"" | "entrada" | "saida">("");
  const [dataFiltro, setDataFiltro] = useState("");

  const filtered = useMemo(() => {
    let result = movimentacoes;

    // Filtro por nome/id item
    if (q.trim()) {
      const qq = q.toLowerCase();
      result = result.filter((mov) => {
        const nome = (mov.nome_item ?? "").toLowerCase();
        const id = String(mov.id_item);
        return nome === qq || id === qq;
      });
    }

    // Filtro por tipo
    if (tipoFiltro) {
      result = result.filter((mov) => mov.tipo === tipoFiltro);
    }

    // Filtro por data
    if (dataFiltro) {
      result = result.filter((mov) => {
        const data = (mov.criado_em ?? "").split("T")[0]; // YYYY-MM-DD
        return data === dataFiltro;
      });
    }

    return result;
  }, [movimentacoes, q, tipoFiltro, dataFiltro]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const resp = await apiGet<ListMovimentacoesResponse>("/movimentacoes", token);
      setMovimentacoes(resp.data ?? []);
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

  return (
    <div>
      <h2>Histórico de Movimentações</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {/* Filtros */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filtros</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          <input
            placeholder="buscar por id/nome"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ gridColumn: "1 / -1" }}
          />
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as "" | "entrada" | "saida")}>
            <option value="">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          <input
            type="date"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
          />
          <button
            onClick={() => {
              setQ("");
              setTipoFiltro("");
              setDataFiltro("");
            }}
            style={{ gridColumn: "1 / -1" }}
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Histórico Geral */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Histórico Geral ({filtered.length} movimentação{filtered.length !== 1 ? "s" : ""})
          </h3>
        </div>

        {loading ? (
          <div className="loading">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
            {q.trim() ? (
              <>
                <div style={{ fontWeight: "bold" }}>Nenhuma movimentação encontrada</div>
                <div>Verifique se o ID ou nome do item está correto</div>
              </>
            ) : (
              "Nenhuma movimentação encontrada"
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID Mov.</th>
                <th>Item ID</th>
                <th>Nome do Item</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mov) => (
                <tr
                  key={mov.id_movimentacao ?? `${mov.id_item}-${mov.criado_em}`}
                  style={
                    mov.tipo === "saida"
                      ? { background: "#ffe0e0" }
                      : { background: "#e0f7e0" }
                  }
                >
                  <td>{mov.id_movimentacao ?? "-"}</td>
                  <td>#{mov.id_item}</td>
                  <td>{mov.nome_item ?? "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        mov.tipo === "entrada" ? "badge-success" : "badge-danger"
                      }`}
                    >
                      {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td style={{ fontWeight: "bold" }}>{mov.quantidade}</td>
                  <td>{mov.criado_em ? String(mov.criado_em).slice(0, 16) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
