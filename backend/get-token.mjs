import dotenv from "dotenv";
dotenv.config({ path: new URL("./.env.local", import.meta.url) });
dotenv.config({ path: new URL("./.env", import.meta.url) });

import { createClient } from "@supabase/supabase-js";

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const email = process.env.SOL_EMAIL;
const password = process.env.SOL_PASS;

const { data, error } = await supa.auth.signInWithPassword({ email, password });
if (error) {
  console.error("Login error:", error.message);
  process.exit(1);
}

console.log(data.session.access_token);