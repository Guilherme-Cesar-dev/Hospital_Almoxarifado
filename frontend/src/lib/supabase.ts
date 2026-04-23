/**
 * ARQUIVO: supabase.ts
 * DESCRIÇÃO: Instância do cliente Supabase para autenticação e acesso ao banco
 * FUNCIONALIDADES:
 *   - Gerencia autenticação com email/senha
 *   - Acesso ao PostgreSQL do Supabase (via RLS)
 *   - Integração com JWT bearer tokens
 *   - Session management automático
 * 
 * CREDENCIAIS: Via variáveis de ambiente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);