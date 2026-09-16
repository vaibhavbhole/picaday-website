"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient, getRepos } from "@/data/browser";
import type { AppUser } from "@/data/types";

type SessionValue = {
  user: AppUser | null;
  loading: boolean;
  unreadCount: number;
  refresh: () => Promise<void>;
  refreshUnread: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      setUnreadCount(await getRepos().notifications.countUnread());
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const refresh = useCallback(async () => {
    const next = await getRepos().auth.getCurrentUser();
    setUser(next);
    if (!next) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await getRepos().notifications.countUnread());
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    refresh().finally(() => {
      if (mounted) setLoading(false);
    });
    const { data } = getBrowserClient().auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    await getRepos().auth.signOut();
    setUser(null);
    setUnreadCount(0);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    function onFocus() {
      void refreshUnread();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUnread]);

  const value = useMemo(
    () => ({ user, loading, unreadCount, refresh, refreshUnread, signOut }),
    [user, loading, unreadCount, refresh, refreshUnread, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}
