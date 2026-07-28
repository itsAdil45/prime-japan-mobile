"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Heart,
  Bell,
  ChevronRight,
  Car,
  RefreshCcw,
  X,
} from "lucide-react";
import useGet from "@/customHooks/useGet";
/* ------------------------------------------------------------------ */
/*  Maps the web home page's sections onto mobile:                     */
/*                                                                      */
/*  Web                    →  Mobile                                   */
/*  Home2Banner            →  dropped (not needed on mobile)            */
/*  Home2Category (brands) →  BrandsRow — horizontal scroll of chips     */
/*  Home2PopularAuction    →  LatestAuctionsSection — vertical cards     */
/*  Home2Faq               →  dropped                                   */
/*                                                                      */
/*  TopBar / SearchBar / CategoryRow are left exactly as they were —    */
/*  untouched per your instruction, still local-only (no filtering      */
/*  wired to them yet).                                                 */
/*                                                                      */
/*  ASSUMPTIONS TO VERIFY against the real /home response:               */
/*  1. requireAuth=false on useGet("/home", ...) — guests can browse,    */
/*     matching web's plain (unauthenticated) fetch.                    */
/*  2. Brand fields (make, logo_url, count) are taken directly from      */
/*     Home2Category — confirmed shape.                                 */
/*  3. Latest-vehicle fields (image_url, name, lot_number, status,       */
/*     external_id) are taken directly from Home2PopularAuction —        */
/*     confirmed shape. PRICE FIELD IS A GUESS — Home2PopularAuction     */
/*     calls an opaque formatPrice(vehicle, currency) helper whose        */
/*     internals weren't shared, so I'm reading vehicle.price_jpy /       */
/*     vehicle.price_usd below. Replace with the real field names once   */
/*     you check the actual /home payload or that helper's source.       */
/* ------------------------------------------------------------------ */

const FontImports = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

/* ---------- Untouched: TopBar / SearchBar / CategoryRow ---------- */

function TopBar({ userName }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6">
      <div>
        <p className="font-ui text-xs text-zinc-400">Good afternoon</p>
        <p className="font-display text-lg font-semibold text-zinc-900">
          {" "}
          <i className="bi bi-person-circle me-2" />
          {userName || "Guest User"}
          <span style={{ top: "40.5px", left: "84.2344px" }} />
        </p>
      </div>
      <button className="relative rounded-full bg-zinc-100 p-2.5">
        <Bell className="h-4.5 w-4.5 text-zinc-600" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-600" />
      </button>
    </div>
  );
}

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

/* ---------- Shared bits ---------- */

function SectionHeader({ title, onSeeAll }) {
  return (
    <div className="mt-7 flex items-center justify-between px-5">
      <h2 className="font-display text-base font-semibold text-zinc-900">
        {title}
      </h2>
      <button
        onClick={onSeeAll}
        className="font-ui flex items-center gap-0.5 text-xs font-medium text-zinc-400"
      >
        See all
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SectionError({ onRetry }) {
  return (
    <div className="font-ui mx-5 mt-3 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
      <span>Couldn't load this section.</span>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 font-semibold"
      >
        <RefreshCcw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}

/* ---------- Auth prompt (mirrors web's AuthPromptModal + handleProtectedNavigate) ---------- */

function AuthPromptSheet({ open, onClose, onLogin }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative rounded-t-2xl bg-white px-5 pb-8 pt-4">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Log in to continue
          </h2>
          <button
            onClick={onClose}
            className="rounded-full bg-zinc-100 p-1.5"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <p className="font-ui mt-2 text-sm text-zinc-500">
          Create a free account to view auction details and place bids.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={onLogin}
            className="font-ui w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Brands row (from Home2Category) ---------- */

function BrandsRow({ brands, totalMakes, onSelectBrand, onSeeAll }) {
  if (!brands || brands.length === 0) return null;

  return (
    <>
      <SectionHeader
        title={`Brands${totalMakes ? ` · ${totalMakes}` : ""}`}
        onSeeAll={onSeeAll}
      />
      <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {brands.map((brand) => (
          <button
            key={brand.make}
            onClick={() => onSelectBrand(brand.make)}
            className="flex w-20 shrink-0 flex-col items-center gap-1.5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200 bg-white p-2.5">
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.make}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Car className="h-5 w-5 text-zinc-300" />
              )}
            </span>
            <span className="font-ui truncate text-[11px] font-medium text-zinc-700">
              {brand.make.charAt(0) + brand.make.slice(1).toLowerCase()}
            </span>
            <span className="font-ui text-[10px] text-zinc-400">
              {brand.count?.toLocaleString() ?? 0}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function BrandsRowSkeleton() {
  return (
    <>
      <div className="mt-7 flex items-center justify-between px-5">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex w-20 shrink-0 flex-col items-center gap-1.5"
          >
            <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-100" />
            <div className="h-2.5 w-12 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Latest auctions (from Home2PopularAuction) ---------- */

function formatPrice(vehicle) {
  // ASSUMPTION — see file header note. Confirm real field names.
  if (vehicle.price_jpy)
    return `¥${Number(vehicle.price_jpy).toLocaleString()}`;
  if (vehicle.price_usd)
    return `$${Number(vehicle.price_usd).toLocaleString()}`;
  return "Price on request";
}

/* ---------- Grid variant (matches the old static VehicleCardGrid layout) ---------- */

function AuctionGridCard({ vehicle, onOpen }) {
  const isLive = vehicle.status !== "sold";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(vehicle)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(vehicle);
      }}
      className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white text-left"
    >
      <div className="relative">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={vehicle.name}
            className="h-24 w-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <Car className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
          </div>
        )}
        <span
          className={`absolute left-2 top-2 font-ui inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white ${
            isLive ? "bg-zinc-900/90" : "bg-zinc-500/90"
          }`}
        >
          {isLive ? "Live" : "Sold"}
        </span>
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5"
          aria-label="Save to watchlist"
        >
          <Heart className="h-3.5 w-3.5 text-zinc-500" />
        </button>
      </div>
      <div className="px-2.5 py-2.5">
        <p className="font-ui truncate text-xs font-medium text-zinc-900">
          {vehicle.name}
        </p>
        <p className="font-ui text-[11px] text-zinc-400">
          Lot # {vehicle.lot_number}
        </p>
        <p className="font-display tabular-nums mt-1 text-sm font-semibold text-zinc-900">
          {formatPrice(vehicle)}
        </p>
      </div>
    </div>
  );
}

function AuctionGridSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="h-24 w-full animate-pulse bg-zinc-100" />
      <div className="space-y-1.5 px-2.5 py-2.5">
        <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-zinc-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}

/* ---------- Root ---------- */

export default function HomeScreen() {
  const [category, setCategory] = useState("All");
  const [pendingVehicle, setPendingVehicle] = useState(null);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const { data, loading, error, refetch } = useGet("/home", true, false);
  const homeData = data?.data ?? null;

  const brands = homeData?.popular_brands ?? [];
  const totalMakes = homeData?.stats?.total_makes;
  const latest = homeData?.latest ?? [];

  const handleSelectBrand = (make) => {
    router.push(`/cars/${make}`);
  };

  const handleOpenAuction = (vehicle) => {
    const href = `/auction/${vehicle.external_id}`;
    if (sessionStatus === "authenticated") {
      router.push(href);
      return;
    }
    // covers both "unauthenticated" and "loading" states — same rule as web
    setPendingVehicle(href);
  };

  const handleLogin = () => {
    const redirect = pendingVehicle ?? "/home";
    setPendingVehicle(null);
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50 font-sans pb-24">
      <FontImports />

      <TopBar userName={session?.user?.name} />
      <SearchBar />
      <CategoryRow active={category} onChange={setCategory} />

      {loading ? (
        <BrandsRowSkeleton />
      ) : error ? (
        <SectionError onRetry={refetch} />
      ) : (
        <BrandsRow
          brands={brands}
          totalMakes={totalMakes}
          onSelectBrand={handleSelectBrand}
          onSeeAll={() => router.push("/makes")}
        />
      )}

      <SectionHeader
        title="Latest auctions"
        onSeeAll={() => router.push("/cars")}
      />
      <div className="mt-3 grid grid-cols-2 gap-3 px-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <AuctionGridSkeleton key={i} />
          ))
        ) : error ? (
          <div className="col-span-2">
            <SectionError onRetry={refetch} />
          </div>
        ) : latest.length === 0 ? (
          <p className="font-ui col-span-2 py-8 text-center text-sm text-zinc-400">
            No auctions available right now.
          </p>
        ) : (
          latest.map((vehicle) => (
            <AuctionGridCard
              key={vehicle.external_id}
              vehicle={vehicle}
              onOpen={handleOpenAuction}
            />
          ))
        )}
      </div>

      <AuthPromptSheet
        open={!!pendingVehicle}
        onClose={() => setPendingVehicle(null)}
        onLogin={handleLogin}
      />
    </div>
  );
}
