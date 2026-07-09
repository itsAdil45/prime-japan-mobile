// app/(app)/bids/page.jsx
"use client";
import { useRouter } from "next/navigation";
import BidsScreen from "@/components/Account/BidsScreen";
export default function BidsPage() {
  const router = useRouter();
  return <BidsScreen onBack={() => router.back()} />;
}
