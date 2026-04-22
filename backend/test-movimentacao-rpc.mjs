
import dotenv from "dotenv";
dotenv.config({ path: new URL("./.env", import.meta.url) });

import { createClient } from "@supabase/supabase-js";

console.log("TEST_ITEM_ID:", process.env.TEST_ITEM_ID);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const ITEM_ID = process.env.TEST_ITEM_ID; // uuid do ITEM

function client() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function login(email, password) {
  const supa = client();
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
  return supa;
}

async function callMov(supa, tipo, quantidade) {
  const { data, error } = await supa.rpc("registrar_movimentacao", {
    p_id_item: ITEM_ID,
    p_tipo: tipo,          // 'entrada' | 'saida'
    p_quantidade: quantidade
  });
  return { data, error };
}

async function readEstoqueAs(supa) {
  // Só almox/admin devem conseguir ler ITEM_ESTOQUE (pela sua policy)
  const { data, error } = await supa
    .from("ITEM_ESTOQUE")
    .select("id_item, saldo_atual, atualizado_por")
    .eq("id_item", ITEM_ID)
    .maybeSingle();

  return { data, error };
}

async function main() {
  if (!ITEM_ID) throw new Error("Missing TEST_ITEM_ID in .env");

  const SOL_EMAIL = process.env.SOL_EMAIL;
  const SOL_PASS = process.env.SOL_PASS;

  const MOV_EMAIL = process.env.MOV_EMAIL;
  const MOV_PASS = process.env.MOV_PASS;

  const ADM_EMAIL = process.env.ADM_EMAIL;
  const ADM_PASS = process.env.ADM_PASS;

  console.log("== Caso A: solicitante chamando RPC (esperado: falhar) ==");
  {
    const supa = await login(SOL_EMAIL, SOL_PASS);
    const { data, error } = await callMov(supa, "entrada", 5);
    console.log("data:", data);
    console.log("error:", error?.message ?? null);
  }

  console.log("\n== Caso B: almox_mov entrada (esperado: OK) ==");
  {
    const supa = await login(MOV_EMAIL, MOV_PASS);

    const before = await readEstoqueAs(supa);
    console.log("estoque before:", before.data, "err:", before.error?.message ?? null);

    const { data, error } = await callMov(supa, "entrada", 10);
    console.log("rpc data:", data);
    console.log("rpc err:", error?.message ?? null);

    const after = await readEstoqueAs(supa);
    console.log("estoque after:", after.data, "err:", after.error?.message ?? null);
  }

  console.log("\n== Caso C: almox_mov saída maior que saldo (esperado: falhar Saldo insuficiente) ==");
  {
    const supa = await login(MOV_EMAIL, MOV_PASS);
    const { data, error } = await callMov(supa, "saida", 999999);
    console.log("data:", data);
    console.log("error:", error?.message ?? null);
  }

  console.log("\n== Caso D: admin lendo estoque (esperado: OK) ==");
  {
    const supa = await login(ADM_EMAIL, ADM_PASS);
    const { data, error } = await readEstoqueAs(supa);
    console.log("estoque(admin):", data);
    console.log("err:", error?.message ?? null);
  }

  console.log("\n== Caso E: solicitante tentando ler estoque (esperado: bloquear/0 rows) ==");
  {
    const supa = await login(SOL_EMAIL, SOL_PASS);
    const { data, error } = await readEstoqueAs(supa);
    console.log("estoque(solicitante):", data);
    console.log("err:", error?.message ?? null);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});