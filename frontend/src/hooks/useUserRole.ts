// name=src/hooks/useUserRole.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type AppRole = "solicitante" | "adm" | "almox_m" | "almox_c";

function normalizeRole(input: unknown): AppRole | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase();
  if (value === "admin") return "adm";
  if (value === "almox_mov") return "almox_m";
  if (value === "almox_cadastros") return "almox_c";
  if (value === "solicitante") return "solicitante";
  return null;
}

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: userResp, error: eUser } = await supabase.auth.getUser();
      if (eUser) throw eUser;

      const userId = userResp.user?.id;
      if (!userId) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("USUARIO")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      setRole(normalizeRole(data?.role));
      setLoading(false);
    })().catch(() => {
      setRole(null);
      setLoading(false);
    });
  }, []);

  return { role, loading };
}