"use client";

import { SessionProvider } from "next-auth/react";
import OfflineProvider from "@/components/OfflineProvider";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <OfflineProvider>{children}</OfflineProvider>
    </SessionProvider>
  );
}
