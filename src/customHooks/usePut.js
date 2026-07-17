"use client";

import { useState } from "react";
import useAxiosAuth from "./useAxiosAuth";
import { signOut } from "next-auth/react";
// import { logout } from "@/components/Logout";
export default function usePut() {
  const { axios, isReady, isAuthenticated } = useAxiosAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const put = async (url, payload, requireAuth = true) => {
    if (requireAuth && (!isReady || !isAuthenticated)) {
      setError("Authentication required");
      throw new Error("Authentication required");
    }

    // Check if auth is ready for non-auth requests
    if (!requireAuth && !isReady) {
      setError("Request not ready");
      throw new Error("Request not ready");
    }

    setLoading(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const res = await axios.put(`${API_BASE_URL}${url}`, payload, {
        headers,
      });
      return res.data;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        // logout();
        signOut({ callbackUrl: "/auth/login" });
      }
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    put,
    loading,
    error,
    isReady,
    isAuthenticated,
  };
}
