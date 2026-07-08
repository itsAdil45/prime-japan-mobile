"use client";

import { useState } from "react";
import {
  Home as HomeIcon,
  Search,
  Heart,
  Package,
  User,
  Bell,
  ChevronRight,
  Car,
  Clock,
  Gauge,
} from "lucide-react";
import Link from "next/link";

const FontImports = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

const TABS = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "search", label: "Search", icon: Search },
  { key: "watchlist", label: "Watchlist", icon: Heart },
  { key: "orders", label: "Orders", icon: Package },
  { key: "account", label: "Account", icon: User },
];

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-6">
      <div>
        <p className="font-ui text-xs text-zinc-400">Good afternoon</p>
        <p className="font-display text-lg font-semibold text-zinc-900">Adil</p>
      </div>
      <button className="relative rounded-full bg-zinc-100 p-2.5">
        <Bell className="h-4.5 w-4.5 text-zinc-600" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-600" />
      </button>
    </div>
  );
}

/* ---------- Search bar ---------- */

function SearchBar() {
  return (
    <button className="font-ui mx-5 mt-5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm">
      <Search className="h-4 w-4 shrink-0 text-zinc-400" />
      <span className="text-sm text-zinc-400">
        Search make, model, or chassis
      </span>
    </button>
  );
}

/* ---------- Category chips ---------- */

const CATEGORIES = ["All", "Sedan", "SUV", "Truck", "Van", "Sports", "Hybrid"];

function CategoryRow({ active, onChange }) {
  return (
    <div className="mt-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {CATEGORIES.map((c) => {
        const isActive = active === c;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`font-ui shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
              isActive ? "bg-[#02ab86] text-white" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Section header ---------- */

function SectionHeader({ title }) {
  return (
    <div className="mt-7 flex items-center justify-between px-5">
      <h2 className="font-display text-base font-semibold text-zinc-900">
        {title}
      </h2>
      <Link
        href="/detail"
        className="font-ui flex items-center gap-0.5 text-xs font-medium text-zinc-400"
      >
        See more
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* ---------- Live badge / countdown ---------- */

function LiveCountdown({ label = "2h 14m" }) {
  return (
    <span className="font-ui inline-flex items-center gap-1.5 rounded-full bg-zinc-900/90 px-2.5 py-1 text-[11px] font-medium text-white">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
      <Clock className="h-3 w-3" />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

/* ---------- Vehicle image placeholder ---------- */

function VehicleThumb({ className = "" }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 ${className}`}
    >
      <Car className="h-7 w-7 text-zinc-400" strokeWidth={1.5} />
    </div>
  );
}

/* ---------- Featured auction card ---------- */

function FeaturedAuctionCard() {
  return (
    <div className="mx-5 mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative">
        <VehicleThumb className="h-36 w-full" />
        <div className="absolute left-3 top-3">
          <LiveCountdown label="1h 42m" />
        </div>
        <button className="absolute right-3 top-3 rounded-full bg-white/90 p-2">
          <Heart className="h-4 w-4 text-zinc-500" />
        </button>
      </div>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-sm font-semibold text-zinc-900">
              Toyota Land Cruiser · 2021
            </p>
            <p className="font-ui mt-0.5 text-xs text-zinc-400">
              Grade 4.5 · 38,200 km
            </p>
          </div>
          <Gauge className="h-4 w-4 shrink-0 text-zinc-300" />
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-ui text-[11px] text-zinc-400">Current bid</p>
            <p className="font-display tabular-nums text-lg font-semibold text-zinc-900">
              ¥2,840,000
            </p>
          </div>
          <button className="font-ui rounded-lg bg-black px-3.5 py-2 text-xs font-semibold text-white">
            Place bid
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Compact vehicle card (horizontal scroll) ---------- */

function VehicleCardCompact() {
  return (
    <div className="w-36 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="relative">
        <VehicleThumb className="h-20 w-full" />
        <div className="absolute left-1.5 top-1.5">
          <span className="font-ui tabular-nums inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-1.5 py-0.5 text-[9px] text-white">
            <Clock className="h-2.5 w-2.5" /> 4h 05m
          </span>
        </div>
      </div>
      <div className="px-2.5 py-2">
        <p className="font-ui truncate text-xs font-medium text-zinc-900">
          Nissan Skyline
        </p>
        <p className="font-display tabular-nums mt-0.5 text-xs font-semibold text-zinc-900">
          ¥1,120,000
        </p>
      </div>
    </div>
  );
}

/* ---------- Grid vehicle card ---------- */

function VehicleCardGrid() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="relative">
        <VehicleThumb className="h-24 w-full" />
        <button className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5">
          <Heart className="h-3.5 w-3.5 text-zinc-500" />
        </button>
      </div>
      <div className="px-2.5 py-2.5">
        <p className="font-ui truncate text-xs font-medium text-zinc-900">
          Honda CR-V · 2020
        </p>
        <p className="font-ui text-[11px] text-zinc-400">52,000 km</p>
        <p className="font-display tabular-nums mt-1 text-sm font-semibold text-zinc-900">
          ¥1,860,000
        </p>
      </div>
    </div>
  );
}

/* ---------- Root ---------- */

export default function HomeScreen() {
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState("home");

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50 font-sans">
      <FontImports />

      <div className="mx-auto w-full max-w-sm pb-24">
        <TopBar />
        <SearchBar />
        <CategoryRow active={category} onChange={setCategory} />

        <SectionHeader title="Ending soon" />
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <VehicleCardCompact />
          <VehicleCardCompact />
          <VehicleCardCompact />
        </div>

        <SectionHeader title="Live auction" />
        <FeaturedAuctionCard />

        <SectionHeader title="Recommended for you" />
        <div className="mt-3 grid grid-cols-2 gap-3 px-5">
          <VehicleCardGrid />
          <VehicleCardGrid />
          <VehicleCardGrid />
          <VehicleCardGrid />
        </div>
      </div>
    </div>
  );
}
