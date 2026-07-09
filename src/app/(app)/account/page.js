// app/(app)/account/page.jsx
"use client";
import { useRouter } from "next/navigation";
import AccountHome from "@/components/account/AccountHome";

const ROUTES = {
  bids: "/bids",
  invoices: "/invoices",
  addresses: "/addresses",
  settings: "/settings",
  "change-password": "/change-password",
  logout: "/login", // or wherever your sign-out redirect goes
};

export default function AccountPage() {
  const router = useRouter();
  return <AccountHome onNavigate={(key) => router.push(ROUTES[key])} />;
}
