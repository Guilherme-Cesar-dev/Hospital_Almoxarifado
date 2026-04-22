import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const hasTokenRef = useRef(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextToken = data.session?.access_token ?? null;
      setToken(nextToken);
      setUserId(data.session?.user?.id ?? null);
      hasTokenRef.current = Boolean(nextToken);
      hydratedRef.current = true;
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const nextToken = session?.access_token ?? null;
      const wasLogged = hasTokenRef.current;
      const isLogged = Boolean(nextToken);

      setToken(nextToken);
      setUserId(session?.user?.id ?? null);

      hasTokenRef.current = isLogged;

      if (hydratedRef.current && event === "SIGNED_IN" && !wasLogged && isLogged) {
        window.location.reload();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { token, userId };
}