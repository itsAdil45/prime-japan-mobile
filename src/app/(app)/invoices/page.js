// app/(app)/bids/page.jsx
"use client";
import { useRouter } from "next/navigation";
import InvoicesScreen from "@/components/Account/InvoicesScreen";
export default function BidsPage() {
  const router = useRouter();
  return <InvoicesScreen onBack={() => router.back()} />;
}
