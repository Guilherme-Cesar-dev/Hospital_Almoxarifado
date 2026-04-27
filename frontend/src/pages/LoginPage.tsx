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
    <div className="login-page">
      <div className="login-glow login-glow--top" />
      <div className="login-glow login-glow--mid" />
      <div className="login-background login-background--top" />
      <div className="login-background login-background--bottom" />

      <main className="login-shell">
        <section className="login-card" aria-label="Entrar no sistema">
          <div className="login-card__header">
            <h1 className="login-card__title">HOSP</h1>
            <p className="login-card__subtitle">Hub de Operações e Suporte ao Paciente</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="login-field">
              <span>E-mail</span>
              <input
                required
                type="email"
                value={email}
                maxLength={60}
                onChange={(e) => setEmail(e.target.value.slice(0, 60))}
                placeholder="seu.email@hospital.com"
                autoComplete="email"
              />
            </label>

            <label className="login-field">
              <span>Senha</span>
              <input
                required
                value={password}
                maxLength={15}
                onChange={(e) => setPassword(e.target.value.slice(0, 15))}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </label>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {err && <p className="login-error">{err}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}