import { useParams } from "react-router-dom";
import { SolicitacaoDetalhePage } from "./SolicitacaoDetalhePage";

export function SolicitacaoDetalheRoute({ token }: { token: string }) {
  const { id } = useParams();
  const n = Number(id);
  if (!Number.isFinite(n)) return <div>ID inválido</div>;
  return <SolicitacaoDetalhePage token={token} id={n} />;
}