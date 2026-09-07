"use client";
import { useState } from "react";
import {
  ChevronRight,
  Gavel,
  Receipt,
  MapPin,
  Settings,
  KeyRound,
  LogOut,
} from "lucide-react";
import { logout } from "../Logout";
import { useSession } from "next-auth/react";
import { themeColors } from "@/theme/themeColors";
import { useCurrency } from "@/context/CurrencyContext";
import useGet from "@/customHooks/useGet";

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

const MOCK_USER = {
  name: "Adil Shakeel",
  customerId: "PJ-20481",
  accountType: "individual",
  emailVerified: true,
};

// Fallback shown before the /bid-requests response lands (or if it errors) —
// keeps CreditsCard/OverviewRow from crashing on undefined fields.
const EMPTY_STATS = {
  credits: { usd: 0, jpy: 0 },
  bids: { pending: 0, won: 0, lost: 0 },
  invoices: { pending: 0, overdue: 0 },
};

// Maps the /bid-requests response's `stats` object (bids, invoices, credit)
// to the shape CreditsCard/OverviewRow expect. Only `stats` is used here —
// the `bids` list in the response is for the Bids screen, not this page.
function mapBidRequestStats(stats) {
  if (!stats) return EMPTY_STATS;
  return {
    credits: {
      usd: stats.credit?.amount_usd ?? 0,
      jpy: stats.credit?.amount_jpy ?? 0,
    },
    bids: {
      pending: stats.bids?.pending ?? 0,
      won: stats.bids?.won ?? 0,
      lost: stats.bids?.lost ?? 0,
    },
    invoices: {
      pending: stats.invoices?.pending ?? 0,
      overdue: stats.invoices?.overdue ?? 0,
    },
  };
}

function ProfileHeader({ user }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="flex items-center gap-3 px-5 pt-6">
      <div className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display truncate text-base font-semibold text-zinc-900">
          {user.name}
        </p>
        <p className="font-ui text-xs text-zinc-400">ID: {user.customerId}</p>
      </div>
      <span
        className={`font-ui shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
          user.emailVerified === true
            ? "bg-blue-50 text-blue-600"
            : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {user.emailVerified === true && <span>Varified</span>}
      </span>
    </div>
  );
}

function CreditsCard({ credits }) {
  const { currency, setCurrency } = useCurrency();
  const handleCurrencySelect = (c) => {
    setCurrency(c);
    // setCurrencyOpen(false);
  };
  // const [currency, setCurrency] = useState("usd");
  return (
    <div className="mx-5 mt-5 rounded-2xl bg-zinc-900 px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="font-ui text-xs text-zinc-400">Available credits</p>
        <div className="font-ui flex overflow-hidden rounded-full bg-white/10 text-[10px] font-semibold">
          {["usd", "jpy"].map((c) => (
            <button
              key={c}
              onClick={() => handleCurrencySelect(c)}
              className={`px-2.5 py-1 uppercase ${
                currency === c ? "bg-orange-600 text-white" : "text-zinc-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <p className="font-display tabular-nums mt-1.5 text-2xl font-semibold text-white">
        {currency === "usd"
          ? `$${Number(credits.usd ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}`
          : `¥${Number(credits.jpy ?? 0).toLocaleString()}`}
      </p>
    </div>
  );
}

function StatPill({ label, count, tone = "zinc" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div
      className={`font-ui flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-4 py-2.5 ${tones[tone]}`}
    >
      <span className="font-display text-base font-semibold">{count}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}

function OverviewRow({ stats, onNavigate }) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between px-5">
        <h2 className="font-display text-sm font-semibold text-zinc-900">
          Overview
        </h2>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        <button onClick={() => onNavigate("bids")}>
          <StatPill
            label="Pending bids"
            count={stats.bids.pending}
            tone="orange"
          />
        </button>
        <button onClick={() => onNavigate("bids")}>
          <StatPill label="Won bids" count={stats.bids.won} tone="zinc" />
        </button>
        <button onClick={() => onNavigate("invoices")}>
          <StatPill
            label="Due invoices"
            count={stats.invoices.pending}
            tone="orange"
          />
        </button>
        <button onClick={() => onNavigate("invoices")}>
          <StatPill label="Overdue" count={stats.invoices.overdue} tone="red" />
        </button>
      </div>
    </div>
  );
}

function NavRow({ icon: Icon, label, sublabel, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="font-ui flex w-full items-center gap-3 border-b border-zinc-100 px-5 py-4 text-left last:border-b-0"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          danger ? "bg-red-50" : "bg-zinc-100"
        }`}
      >
        <Icon
          className={`h-4 w-4 ${danger ? "text-red-600" : "text-zinc-600"}`}
        />
      </span>
      <span className="flex-1">
        <p
          className={`text-sm font-medium ${
            danger ? "text-red-600" : "text-zinc-900"
          }`}
        >
          {label}
        </p>
        {sublabel && <p className="text-xs text-zinc-400">{sublabel}</p>}
      </span>
      {!danger && <ChevronRight className="h-4 w-4 text-zinc-300" />}
    </button>
  );
}

export default function AccountHome({ onNavigate = () => {} }) {
  const { data: session } = useSession();
  const user_Data = {
    name: session?.user?.name || "Guest User",
    customerId: session?.user?.customer_id || "",
    emailVerified: session?.user?.email_verified || "",
  };

  // Overview + Available credits are both driven by the `stats` object from
  // /bid-requests. The `bids` list in that response isn't used here — it
  // belongs to the Bids screen.
  const { data, loading: statsLoading } = useGet("/bid-requests", true, true);
  const stats = statsLoading
    ? EMPTY_STATS
    : mapBidRequestStats(data?.data?.stats);

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 font-sans">
      <StyleBlock />

      <ProfileHeader user={user_Data} />
      <CreditsCard credits={stats.credits} />
      <OverviewRow stats={stats} onNavigate={onNavigate} />

      <div className="mx-5 mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <NavRow
          icon={Gavel}
          label="Bid requests"
          sublabel="Track your auction bids"
          onClick={() => onNavigate("bids")}
        />
        <NavRow
          icon={Receipt}
          label="Invoices"
          sublabel="View payment history"
          onClick={() => onNavigate("invoices")}
        />
        <NavRow
          icon={MapPin}
          label="Addresses"
          sublabel="Manage shipping addresses"
          onClick={() => onNavigate("addresses")}
        />
        <NavRow
          icon={Settings}
          label="Settings"
          sublabel="Edit profile information"
          onClick={() => onNavigate("settings")}
        />
        <NavRow
          icon={KeyRound}
          label="Change password"
          onClick={() => onNavigate("change-password")}
        />
      </div>

      {session?.user ? (
        <div className="mx-5 mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <NavRow
            icon={LogOut}
            label="Log out"
            onClick={() => logout()}
            danger
          />
        </div>
      ) : (
        <div className="mt-10 ms-5">
          <a
            href="/login"
            className="text-white p-3 px-8 rounded-md"
            style={{ background: themeColors.primary }}
          >
            Login / Sign Up
          </a>
        </div>
      )}
    </div>
  );
}
