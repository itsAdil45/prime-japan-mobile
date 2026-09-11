"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import OfflineProvider from "@/components/OfflineProvider";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <OfflineProvider>
        {children}
        <Toaster position="top-center" />
      </OfflineProvider>
    </SessionProvider>
  );
}
