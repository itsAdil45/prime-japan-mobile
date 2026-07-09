// app/(app)/bids/page.jsx
"use client";
import { useRouter } from "next/navigation";
import ChangePasswordScreen from "@/components/Account/ChangePasswordScreen";
export default function BidsPage() {
  const router = useRouter();
  return <ChangePasswordScreen onBack={() => router.back()} />;
}
