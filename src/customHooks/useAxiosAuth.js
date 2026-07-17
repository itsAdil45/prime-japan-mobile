"use client";

import axios from "../libs/axios.js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function useAxiosAuth() {
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      setIsReady(false);
      return;
    }

    if (session?.user?.token) {
      axios.defaults.headers.common["Authorization"] =
        `Bearer ${session.user.token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }

    setIsReady(true);
  }, [session, status]);

  return { axios, isReady, isAuthenticated: !!session?.user?.token };
}
