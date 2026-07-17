// hooks/useDelete.js
"use client";

import { useState } from "react";
import useAxiosAuth from "./useAxiosAuth";
import { signOut } from "next-auth/react";
// import { logout } from "@/components/Logout";
const useDelete = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { axios, isReady, isAuthenticated } = useAxiosAuth();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const deleteData = async (url, requireAuth = true) => {
    // Check if auth is required and ready
    if (requireAuth && (!isReady || !isAuthenticated)) {
      setError("Authentication required");
      return null;
    }

    // Check if auth is ready for non-auth requests
    if (!requireAuth && !isReady) {
      setError("Request not ready");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = {
        Accept: "application/json",
      };

      const response = await axios.delete(`${API_BASE_URL}${url}`, { headers });
      return response.data;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        // logout();
        signOut({ callbackUrl: "/auth/login" });
      }
      setError(err.response?.data?.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteData,
    loading,
    error,
    isReady,
    isAuthenticated,
  };
};

export default useDelete;
