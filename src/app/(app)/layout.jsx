import BottomTabBar from "@/components/Menus/BottomTabBar";
import BackToHomeGuard from "@/components/BackToHomeGuard";

export default function AppLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-zinc-50">
      <BackToHomeGuard />
      <div className="pb-20">{children}</div>
      <BottomTabBar />
    </div>
  );
}
