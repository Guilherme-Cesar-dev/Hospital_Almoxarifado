import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, Outlet } from "react-router-dom";
import { useAuthToken } from "./hooks/useAuthToken";
import { useUserRole } from "./hooks/useUserRole";
import { LoginPage } from "./pages/LoginPage";
import { SolicitacoesListPage } from "./pages/SolicitacaoListPage";
import { SolicitacaoDetalheRoute } from "./pages/SolicitacaoDetalheRoute";
import { NovaSolicitacaoPage } from "./pages/NovaSolicitacaoPage";
import { AlmoxSolicitacoesPage } from "./pages/AlmoxSolicitacoesPage";
import { AlmoxMovPage } from "./pages/AlmoxMovPage";
import { InventarioPage } from "./pages/InventarioPage";
import { HistoricoMovimentacoesPage } from "./pages/HistoricoMovimentacoesPage";
import { supabase } from "./lib/supabase";
import type { AppRole } from "./hooks/useUserRole";
import "./App.css";

const roleUI: Record<AppRole, { label: string; color: string }> = {
  solicitante: { label: "Solicitante", color: "#1565c0" },
  almox_m: { label: "Almox Mov", color: "#ef6c00" },
  almox_c: { label: "Almox Cadastro", color: "#2e7d32" },
  adm: { label: "Gerente", color: "#c62828" },
};

function Layout({ role, userName }: { role: AppRole; userName: string }) {
  const canSolicitante = role === "solicitante" || role === "adm";
  const canAlmoxM = role === "almox_m" || role === "adm";
  const canAlmoxC = role === "almox_c" || role === "adm";
  const roleInfo = roleUI[role];

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {canSolicitante && <Link to="/solicitacoes">Minhas solicitações</Link>}
        {canSolicitante && <Link to="/solicitacoes/nova">Nova solicitação</Link>}

        {canAlmoxM && <Link to="/almox/solicitacoes">Solicitações (almox)</Link>}
        {canAlmoxM && <Link to="/almox/movimentacao">Movimentação de estoque</Link>}

        {canAlmoxC && <Link to="/inventario">Inventário</Link>}
        {canAlmoxC && <Link to="/historico">Histórico de Movimentações</Link>}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              background: roleInfo.color,
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              minWidth: 110,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              whiteSpace: "nowrap",
            }}
          >
            {userName} {roleInfo.label}
          </span>
          <button onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}

export default function App() {
  const { token } = useAuthToken();
  const { role, loading } = useUserRole();
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;

      const fromMetadata =
        (typeof metadata.nome === "string" && metadata.nome.trim()) ||
        (typeof metadata.name === "string" && metadata.name.trim()) ||
        (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
        "";

      const resolvedName = fromMetadata;

      if (active) setUserName(resolvedName);
    })().catch(() => {
      if (active) setUserName("Usuário");
    });

    return () => {
      active = false;
    };
  }, []);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (loading) return <div>Carregando…</div>;
  if (!role) return <div>Role ausente ou inválida na tabela USUARIO</div>;

  const canSolicitante = role === "solicitante" || role === "adm";
  const canAlmoxM = role === "almox_m" || role === "adm";
  const canAlmoxC = role === "almox_c" || role === "adm";

  // landing por role
  const defaultPath =
    role === "almox_c"
      ? "/inventario"
      : role === "almox_m"
        ? "/almox/solicitacoes"
        : "/solicitacoes";

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultPath} replace />} />

      <Route element={<Layout role={role} userName={userName} />}>
        <Route path="/" element={<Navigate to={defaultPath} replace />} />

        {(canSolicitante || canAlmoxM) && (
          <Route path="/solicitacoes/:id" element={<SolicitacaoDetalheRoute token={token} />} />
        )}

        {canSolicitante && (
          <>
            <Route path="/solicitacoes" element={<SolicitacoesListPage token={token} />} />
            <Route path="/solicitacoes/nova" element={<NovaSolicitacaoPage token={token} />} />
          </>
        )}

        {canAlmoxM && (
          <>
            <Route path="/almox/solicitacoes" element={<AlmoxSolicitacoesPage token={token} />} />
            <Route path="/almox/movimentacao" element={<AlmoxMovPage token={token} />} />
          </>
        )}

        {canAlmoxC && (
          <>
            <Route path="/inventario" element={<InventarioPage token={token} />} />
            <Route path="/historico" element={<HistoricoMovimentacoesPage token={token} />} />
          </>
        )}

        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Route>
    </Routes>
  );
}