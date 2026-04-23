import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    navigate("/solicitacoes", { replace: true });
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 360 }}>
      <h2>Entrar</h2>
      <form onSubmit={onSubmit}>
        <input required value={email} maxLength={60} onChange={(e) => setEmail(e.target.value.slice(0, 60))} placeholder="email" />
        <input required value={password} maxLength={15} onChange={(e) => setPassword(e.target.value.slice(0, 15))} placeholder="senha" type="password" />
        <button type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
      </form>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}