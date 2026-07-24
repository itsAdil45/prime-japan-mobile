"use client";
import BottomTabBar from "@/components/Menus/BottomTabBar";
import BackToHomeGuard from "@/components/BackToHomeGuard";
// import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { useStatusBar } from "@/hook/useStatusBar";
export default function AppLayout({ children }) {
  useStatusBar();

  return (
    <div className="relative min-h-screen bg-zinc-50">
      <BackToHomeGuard />
      <div className="pb-20">{children}</div>
      {/* <ServiceWorkerRegister /> */}
      <BottomTabBar />
    </div>
  );
}
