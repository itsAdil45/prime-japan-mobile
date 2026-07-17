import { useEffect, useState, useRef } from "react";
import useAxiosAuth from "./useAxiosAuth";
import { signOut } from "next-auth/react";
// import { logout } from "@/components/Logout";

/* ------------------------------------------------------------------ */
/*  In-memory cache, keyed by URL. Lives at module scope, so it        */
/*  survives component unmount/remount across client-side navigation   */
/*  (e.g. Home → Search → back to Home) as long as the app itself       */
/*  isn't fully reloaded. It does NOT survive an actual page reload or  */
/*  app relaunch — that's intentional, this is a navigation-speed        */
/*  cache, not persistent offline storage (that's the separate service  */
/*  worker cache).                                                      */
/*                                                                      */
/*  Behavior on remount when a cache entry exists:                      */
/*    1. Cached data renders immediately — no loading flash             */
/*    2. A silent revalidation fetch runs in the background             */
/*    3. If the revalidated data differs, the screen updates in place   */
/*                                                                      */
/*  CACHE_TTL_MS controls how long a cached entry is considered fresh   */
/*  enough to skip the background revalidation entirely (rare screens   */
/*  that change often should use a shorter TTL, or call refetch()        */
/*  manually on pull-to-refresh regardless of TTL).                     */
/* ------------------------------------------------------------------ */

const cache = new Map(); // url -> { data, statusCode, timestamp }
const CACHE_TTL_MS = 30_000; // 30s — tune per how fresh each endpoint needs to be

export default function useGet(url, immediate = true, requireAuth = true) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { axios, isReady, isAuthenticated } = useAxiosAuth();

  const cached = url ? cache.get(url) : null;

  const [data, setData] = useState(cached?.data ?? null);
  const [loading, setLoading] = useState(immediate && !cached);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(cached?.statusCode ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = async ({ silent = false } = {}) => {
    if (!url) return;

    if (!silent) setLoading(true);
    setError(null);

    try {
      const headers = {};
      const res = await axios.get(`${API_BASE_URL}${url}`, { headers });

      cache.set(url, {
        data: res.data,
        statusCode: res.status,
        timestamp: Date.now(),
      });

      if (!mountedRef.current) return;
      setStatusCode(res.status);
      setData(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        // logout();
        signOut({ callbackUrl: "/auth/login" });
      }
      if (!mountedRef.current) return;
      setStatusCode(status);
      setError(err.response?.data || err.message);
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!immediate || !url || !isReady) return;

    const entry = cache.get(url);
    const isFresh = entry && Date.now() - entry.timestamp < CACHE_TTL_MS;

    // Serve cached data immediately, regardless of freshness
    if (entry) {
      setData(entry.data);
      setStatusCode(entry.statusCode);
      setLoading(false);
    }

    const canRun = requireAuth ? isAuthenticated : true;
    if (!canRun) {
      if (!entry) setLoading(false);
      return;
    }

    if (entry && isFresh) return; // fresh enough — skip refetch entirely
    fetch({ silent: !!entry }); // silent revalidate if we already showed cached data
  }, [url, isReady, isAuthenticated, immediate, requireAuth]);

  return { data, loading, error, statusCode, refetch: fetch };
}

/* Optional: call this after a mutation (e.g. usePost/usePut/useDelete
   success) to drop a stale cache entry so the next mount/refetch for
   that URL is guaranteed fresh instead of waiting out the TTL. */
export function invalidateCache(url) {
  cache.delete(url);
}
