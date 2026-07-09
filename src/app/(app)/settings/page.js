// app/(app)/bids/page.jsx
"use client";
import { useRouter } from "next/navigation";
import SettingsScreen from "@/components/Account/SettingsScreen";
export default function BidsPage() {
  const router = useRouter();
  return <SettingsScreen onBack={() => router.back()} />;
}
