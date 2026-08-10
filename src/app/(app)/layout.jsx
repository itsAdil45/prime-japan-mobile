"use client";
import BottomTabBar from "@/components/Menus/BottomTabBar";
import BackToHomeGuard from "@/components/BackToHomeGuard";
import { CurrencyProvider } from "@/context/CurrencyContext";
// import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { useStatusBar } from "@/hook/useStatusBar";
export default function AppLayout({ children }) {
  useStatusBar();

  return (
    <div className="relative min-h-screen bg-zinc-50">
      <CurrencyProvider>
        <BackToHomeGuard />
        <div className="pb-20">{children}</div>
        {/* <ServiceWorkerRegister /> */}
        <BottomTabBar />
      </CurrencyProvider>
    </div>
  );
}
