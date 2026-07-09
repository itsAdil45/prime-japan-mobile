// app/(app)/bids/page.jsx
"use client";
import { useRouter } from "next/navigation";
import AddressesScreen from "@/components/Account/AddressesScreen";
export default function BidsPage() {
  const router = useRouter();
  return <AddressesScreen onBack={() => router.back()} />;
}
