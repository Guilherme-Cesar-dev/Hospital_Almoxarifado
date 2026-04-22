import express from "express";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options(/.*/, cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.get("/health", (req, res) =>
  res.json({
    ok: true,
    file: "server.mjs",
    port: process.env.PORT || 3000,
    ts: new Date().toISOString(),
  })
);

app.get("/itens", requireAuth, async (req, res) => {
  const supa = supabaseForUser(req.accessToken);

  const { data, error } = await supa
    .from("ITEM")
    .select("id_item,nome,tipo,quantidade,validade,estoque_minimo")
    .order("nome", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true, data });
});

app.post("/itens", requireAuth, async (req, res) => {
  const { nome, tipo, validade, estoque_minimo } = req.body;

  if (!nome || !tipo) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, tipo" });
  }

  const supa = supabaseForUser(req.accessToken);

  const { data, error } = await supa
    .from("ITEM")
    .insert({
      nome,
      tipo,
      validade: validade || null,
      estoque_minimo: Number.isFinite(Number(estoque_minimo)) ? Number(estoque_minimo) : 0,
      quantidade: 0,
    })
    .select("id_item,nome,tipo,quantidade,validade,estoque_minimo")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true, data });
});

app.get("/solicitacoes/:id", requireAuth, async (req, res) => {
  const id_solicitacao = Number(req.params.id);
  if (!Number.isFinite(id_solicitacao) || id_solicitacao <= 0) {
    return res.status(400).json({ error: "id_solicitacao inválido" });
  }

  const supa = supabaseForUser(req.accessToken);

  const { data: rows, error } = await supa
    .from("vw_solicitacao_detalhe")
    .select("*")
    .eq("id_solicitacao", id_solicitacao)
    .order("id_solicitacao_item", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  if (!rows || rows.length === 0) {
    return res.status(404).json({ error: "Solicitação não encontrada ou sem permissão" });
  }

  const first = rows[0];

  const solicitacao = {
    id_solicitacao: first.id_solicitacao,
    titulo: first.titulo,
    descricao: first.descricao,
    setor: first.setor,
    estado: first.estado,
    solicitante_user_id: first.solicitante_user_id,
    quando: first.quando,
    concluida_por: first.concluida_por,
    concluida_em: first.concluida_em,
    atendimento_resumo: first.atendimento_resumo,
  };

  const itens = rows.map((r) => ({
    id_solicitacao_item: r.id_solicitacao_item,
    id_item: r.id_item,
    quantidade: r.solicitada_quantidade,
    quantidade_aprovada: r.quantidade_aprovada,
    observacao: r.observacao,
    item: {
      nome: r.item_nome,
      tipo: r.item_tipo,
      quantidade_atual: r.item_quantidade_atual,
      validade: r.item_validade,
      estoque_minimo: r.item_estoque_minimo,
    },
  }));

  return res.json({ ok: true, data: { solicitacao, itens } });
});

app.get("/solicitacoes", requireAuth, async (req, res) => {
  const supa = supabaseForUser(req.accessToken);
  const estado = typeof req.query.estado === "string" ? req.query.estado : null;

  let q = supa
    .from("SOLICITACAO")
    .select("id_solicitacao,titulo,descricao,setor,estado,quando")
    .order("id_solicitacao", { ascending: false });

  if (estado) q = q.eq("estado", estado);

  const { data, error } = await q;

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true, data });
});

app.get("/solicitacoes/:id/itens", requireAuth, async (req, res) => {
  const id_solicitacao = Number(req.params.id);

  if (!Number.isFinite(id_solicitacao) || id_solicitacao <= 0) {
    return res.status(400).json({ error: "id_solicitacao inválido" });
  }

  const supa = supabaseForUser(req.accessToken);

  const { data, error } = await supa
    .from("SOLICITACAO_ITEM")
    .select("*")
    .eq("id_solicitacao", id_solicitacao)
    .order("quando", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true, data });
});

app.post("/solicitacoes", requireAuth, async (req, res) => {
  const { titulo, setor, descricao } = req.body;

  if (!titulo || !setor || !descricao) {
    return res.status(400).json({ error: "Campos obrigatórios: titulo, setor, descricao" });
  }

  const supa = supabaseForUser(req.accessToken);

  const { data, error } = await supa
    .from("SOLICITACAO")
    .insert({
      solicitante_user_id: req.user.id,
      titulo,
      setor,
      descricao,
      estado: "pendente",
    })
    .select("*")
    .single();

  if (error) {
    const details = [error.message, error.details, error.hint].filter(Boolean).join(" | ");
    return res.status(400).json({ error: details || "Falha ao criar solicitação" });
  }

  return res.json({ ok: true, data });
});

app.post("/solicitacoes/:id/cancelar", requireAuth, async (req, res) => {
  const id_solicitacao = Number(req.params.id);
  if (!Number.isFinite(id_solicitacao) || id_solicitacao <= 0) {
    return res.status(400).json({ error: "id_solicitacao inválido" });
  }

  const supa = supabaseForUser(req.accessToken);

  const { data, error } = await supa
    .from("SOLICITACAO")
    .update({ estado: "cancelada" })
    .eq("id_solicitacao", id_solicitacao)
    .eq("estado", "pendente") // <-- regra A: só permite cancelar pendente
    .select("*")
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) {
    return res.status(404).json({
      error: "Solicitação não encontrada, sem permissão, ou não está pendente",
    });
  }

  return res.json({ ok: true, data });
});

app.post("/solicitacoes/:id/atender", requireAuth, async (req, res) => {
  const id_solicitacao = Number(req.params.id);
  if (!Number.isFinite(id_solicitacao) || id_solicitacao <= 0) {
    return res.status(400).json({ error: "id_solicitacao inválido" });
  }

  const supa = supabaseForUser(req.accessToken);

  const { data, error } = await supa.rpc("atender_solicitacao", {
    p_id_solicitacao: id_solicitacao,
  });

  if (error) return res.status(400).json({ error: error.message });

  return res.json({ ok: true, data });
});

app.post("/solicitacoes/:id/itens", requireAuth, async (req, res) => {
  const id_solicitacao = Number(req.params.id);
  const { id_item, quantidade, observacao } = req.body;

  if (!Number.isFinite(id_solicitacao) || id_solicitacao <= 0) {
    return res.status(400).json({ error: "id_solicitacao inválido" });
  }
  if (!Number.isFinite(Number(id_item)) || !Number.isFinite(Number(quantidade))) {
    return res.status(400).json({ error: "Campos obrigatórios: id_item (num), quantidade (num)" });
  }

  const supa = supabaseForUser(req.accessToken);

  // Regra: só permite adicionar itens quando a solicitação estiver pendente
  const { data: sol, error: eSol } = await supa
    .from("SOLICITACAO")
    .select("id_solicitacao, estado")
    .eq("id_solicitacao", id_solicitacao)
    .maybeSingle();

  if (eSol) return res.status(400).json({ error: eSol.message });
  if (!sol) return res.status(404).json({ error: "Solicitação não encontrada ou sem permissão" });
  if (sol.estado !== "pendente") {
    return res.status(409).json({ error: "Só é possível adicionar itens quando a solicitação estiver pendente" });
  }

  const { data, error } = await supa
    .from("SOLICITACAO_ITEM")
    .insert({
      id_solicitacao,
      id_item: Number(id_item),
      quantidade: Number(quantidade),
      observacao: observacao ?? null,
    })
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true, data });
});

app.post("/movimentacoes", requireAuth, async (req, res) => {
  const { id_item, tipo, quantidade } = req.body;

  if (id_item == null || tipo == null || quantidade == null) {
    return res.status(400).json({ error: "Campos obrigatórios: id_item, tipo, quantidade" });
  }

  const supa = supabaseForUser(req.accessToken);

  const { data, error } = await supa.rpc("registrar_movimentacao", {
    p_id_item: id_item,       // bigint (int8)
    p_tipo: tipo,             // 'entrada' | 'saida'
    p_quantidade: quantidade, // int
  });

  if (error) {
    // Erros de permissão / saldo insuficiente / validações
    return res.status(400).json({ error: error.message });
  }

  return res.json({ ok: true, data });
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 3000;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment.");
}

// Cliente “base” (sem usuário) só pra validar token
const supabaseBase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing Bearer token" });

  const { data, error } = await supabaseBase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });

  req.accessToken = token;
  req.user = data.user;
  next();
}

// Cria client “em nome do usuário”
function supabaseForUser(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}


app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});