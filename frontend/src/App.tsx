import { Routes, Route, Navigate, Link, Outlet } from "react-router-dom";
import { useAuthToken } from "./hooks/useAuthToken";
import { useUserRole } from "./hooks/useUserRole";
import { LoginPage } from "./pages/LoginPage";
import { SolicitacoesListPage } from "./pages/SolicitacaoListPage";
import { SolicitacaoDetalheRoute } from "./pages/SolicitacaoDetalheRoute";
import { NovaSolicitacaoPage } from "./pages/NovaSolicitacaoPage";
import { AlmoxPendentesPage } from "./pages/AlmoxPendentePage";
import { AlmoxSolicitacoesPage } from "./pages/AlmoxSolicitacoesPage";
import { InventarioPage } from "./pages/InventarioPage";
import { supabase } from "./lib/supabase";
import type { AppRole } from "./hooks/useUserRole";

function Layout({ role }: { role: AppRole }) {
  const canSolicitante = role === "solicitante" || role === "adm";
  const canAlmoxM = role === "almox_m" || role === "adm";
  const canAlmoxC = role === "almox_c" || role === "adm";

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {canSolicitante && <Link to="/solicitacoes">Minhas solicitações</Link>}
        {canSolicitante && <Link to="/solicitacoes/nova">Nova solicitação</Link>}

        {canAlmoxM && <Link to="/almox/pendentes">Almox (pendentes)</Link>}
        {canAlmoxM && <Link to="/almox/solicitacoes">Solicitações (almox)</Link>}

        {canAlmoxC && <Link to="/inventario">Inventário</Link>}

        <button onClick={() => supabase.auth.signOut()}>Sair</button>
      </nav>

      <Outlet />
    </div>
  );
}

export default function App() {
  const { token } = useAuthToken();
  const { role, loading } = useUserRole();

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
        ? "/almox/pendentes"
        : "/solicitacoes";

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultPath} replace />} />

      <Route element={<Layout role={role} />}>
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
            <Route path="/almox/pendentes" element={<AlmoxPendentesPage token={token} />} />
            <Route path="/almox/solicitacoes" element={<AlmoxSolicitacoesPage token={token} />} />
          </>
        )}

        {canAlmoxC && (
          <>
            <Route path="/inventario" element={<InventarioPage token={token} />} />
          </>
        )}

        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Route>
    </Routes>
  );
}