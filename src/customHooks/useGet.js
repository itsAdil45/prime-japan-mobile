import { useEffect, useState } from "react";
import useAxiosAuth from "./useAxiosAuth";
import { signOut } from "next-auth/react";
// import { logout } from "@/components/Logout";
export default function useGet(url, immediate = true, requireAuth = true) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const { axios, isReady, isAuthenticated } = useAxiosAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(null);
  const fetch = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const headers = {};

      const res = await axios.get(`${API_BASE_URL}${url}`, { headers });
      setStatusCode(res.status);
      setData(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        // logout();
        signOut({ callbackUrl: "/auth/login" });
      }
      setStatusCode(status);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!immediate || !url || !isReady) return;

    if (requireAuth) {
      if (isAuthenticated) fetch();
      else setLoading(false);
    } else {
      fetch();
    }
  }, [url, isReady, isAuthenticated, immediate, requireAuth]);

  return { data, loading, error, statusCode, refetch: fetch };
}
