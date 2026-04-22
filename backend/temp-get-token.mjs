import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const { data, error } = await supa.auth.signInWithPassword({ email: "solicitante@alomox.hosp", password: "1234" });
if (error) { console.error(error.message); process.exit(1); }
console.log(data.session.access_token);
