"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ChevronLeft,
  SlidersHorizontal,
  Search,
  X,
  Heart,
  Clock,
  ArrowUpDown,
  Gauge,
  Fuel,
  Car,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  This file mirrors CarsShopComponent / AuctionSidebarFilters /      */
/*  AuctionGrid / AuctionCard from the web app, redesigned for a       */
/*  single-column mobile webview rather than a sidebar layout:         */
/*                                                                      */
/*  Web              →  Mobile                                         */
/*  Sidebar filters  →  Bottom sheet opened by a filter button          */
/*  MUI dual sliders →  Custom native dual <input type="range">        */
/*  Pagination links →  Infinite scroll (IntersectionObserver sentinel) */
/*  Horizontal cards →  Compact vertical cards, 1-column                */
/*                                                                      */
/*  No API calls here — filtering, chips, and scroll-pagination all     */
/*  run against generated mock data so the interaction logic can be     */
/*  reviewed before wiring to /vehicles and /vehicles/filters.           */
/*                                                                      */
/*  Split points for the real project:                                  */
/*    components/shop/FilterSheet.jsx                                   */
/*    components/shop/DualRangeSlider.jsx                                */
/*    components/shop/VehicleCard.jsx                                   */
/*    components/shop/FilterChips.jsx                                   */
/*    components/shop/ShopTopBar.jsx                                    */
/*    This screen (app/(app)/search/page.jsx) then just composes them.  */
/* ------------------------------------------------------------------ */

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }

    .range-input {
      -webkit-appearance: none;
      appearance: none;
      position: absolute;
      width: 100%;
      height: 4px;
      background: transparent;
      pointer-events: none;
      margin: 0;
    }
    .range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      pointer-events: auto;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #fff;
      border: 2.5px solid #18181b;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      cursor: pointer;
      margin-top: -7px;
    }
    .range-input::-moz-range-thumb {
      pointer-events: auto;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #fff;
      border: 2.5px solid #18181b;
      cursor: pointer;
    }
    .range-input::-webkit-slider-runnable-track {
      height: 4px;
      background: transparent;
    }
  `}</style>
);

/* ---------- Mock data ---------- */

const MAKES = ["Toyota", "Honda", "Nissan", "Mazda", "Subaru", "Suzuki"];
const MODELS = {
  Toyota: ["Land Cruiser", "Corolla", "Prius", "Hilux"],
  Honda: ["Civic", "CR-V", "Fit", "Vezel"],
  Nissan: ["Skyline", "X-Trail", "Note", "Navara"],
  Mazda: ["CX-5", "Demio", "Axela"],
  Subaru: ["Forester", "Impreza", "Outback"],
  Suzuki: ["Jimny", "Swift", "Escudo"],
};
const BODY_TYPES = ["SUV", "Sedan", "Hatchback", "Truck", "Van"];
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid"];
const TRANSMISSIONS = ["Automatic", "Manual"];
const SOURCES = ["auction", "stock"];

const DEFAULT_FILTERS = {
  source: "",
  make: "",
  model: "",
  yearMin: 2005,
  yearMax: 2026,
  priceMin: "",
  priceMax: "",
  mileageMax: 1000000,
  engineMin: 660,
  engineMax: 10000,
};

const CHIP_LABELS = {
  source: "Source",
  make: "Make",
  model: "Model",
  yearMin: "Year from",
  yearMax: "Year to",
  priceMin: "Min price",
  priceMax: "Max price",
  mileageMax: "Max mileage",
  engineMin: "Min engine",
  engineMax: "Max engine",
};

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateVehicles(count) {
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededRandom(i * 7.1);
    const r2 = seededRandom(i * 3.3 + 1);
    const r3 = seededRandom(i * 5.9 + 2);
    const make = MAKES[Math.floor(r1 * MAKES.length)];
    const modelList = MODELS[make];
    const model = modelList[Math.floor(r2 * modelList.length)];
    const isLive = r3 > 0.55;
    return {
      id: `veh-${i}`,
      make,
      model,
      year: 2005 + Math.floor(r1 * 20),
      mileage: Math.floor(r2 * 180000),
      price: 800000 + Math.floor(r3 * 4200000),
      engineCc: 660 + Math.floor(r1 * 3200),
      bodyType: BODY_TYPES[Math.floor(r2 * BODY_TYPES.length)],
      fuelType: FUEL_TYPES[Math.floor(r3 * FUEL_TYPES.length)],
      transmission: TRANSMISSIONS[Math.floor(r1 * TRANSMISSIONS.length)],
      source: SOURCES[Math.floor(r2 * SOURCES.length)],
      status: isLive ? "live" : "upcoming",
      countdownLabel: isLive
        ? `${Math.floor(r1 * 20) + 1}h ${Math.floor(r2 * 59)}m`
        : null,
      lotNo: `LOT-${1000 + i}`,
    };
  });
}

const ALL_VEHICLES = generateVehicles(54);

/* ---------- Formatting ---------- */

const formatPrice = (jpy) => `¥${jpy.toLocaleString()}`;
const formatMileage = (km) => `${(km / 1000).toFixed(0)}k km`;
const formatEngine = (cc) =>
  cc >= 1000 ? `${(cc / 1000).toFixed(1)}L` : `${cc}cc`;

/* ---------- Bottom sheet shell (reusable) ---------- */

function BottomSheet({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[85vh] flex-col rounded-t-2xl bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-zinc-100 p-1.5"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-zinc-100 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Dual range slider ---------- */

function DualRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  format,
}) {
  const handleMinChange = (e) => {
    const next = Math.min(Number(e.target.value), valueMax - step);
    onChange([next, valueMax]);
  };
  const handleMaxChange = (e) => {
    const next = Math.max(Number(e.target.value), valueMin + step);
    onChange([valueMin, next]);
  };

  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;

  return (
    <div className="font-ui">
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-900"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        <input
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={handleMinChange}
        />
        <input
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={handleMaxChange}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{format(valueMin)}</span>
        <span>{format(valueMax)}</span>
      </div>
    </div>
  );
}

/* ---------- Single (max-only) slider ---------- */

function MaxSlider({ min, max, step, value, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="font-ui">
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-900"
          style={{ left: 0, right: `${100 - pct}%` }}
        />
        <input
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{format(min)}</span>
        <span className="font-medium text-zinc-900">{format(value)}</span>
      </div>
    </div>
  );
}

/* ---------- Filter field primitives ---------- */

function FilterLabel({ children }) {
  return (
    <p className="font-ui mb-2 text-xs font-medium text-zinc-500">{children}</p>
  );
}

function ChipSelect({ options, value, onChange, allLabel = "All" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("")}
        className={`font-ui rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${
          value === "" ? "bg-[#02ab86] text-white" : "bg-zinc-100 text-zinc-500"
        }`}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`font-ui rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${
            value === opt
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ---------- Filter sheet content ---------- */

function FilterSheetContent({ draft, setDraft }) {
  const patch = (updates) => setDraft((prev) => ({ ...prev, ...updates }));
  const models = draft.make ? (MODELS[draft.make] ?? []) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <FilterLabel>Source</FilterLabel>
        <ChipSelect
          options={SOURCES}
          value={draft.source}
          onChange={(v) => patch({ source: v })}
        />
      </div>

      <div>
        <FilterLabel>Make</FilterLabel>
        <ChipSelect
          options={MAKES}
          value={draft.make}
          allLabel="Any make"
          onChange={(v) => patch({ make: v, model: "" })}
        />
      </div>

      {draft.make && (
        <div>
          <FilterLabel>Model</FilterLabel>
          <ChipSelect
            options={models}
            value={draft.model}
            allLabel="Any model"
            onChange={(v) => patch({ model: v })}
          />
        </div>
      )}

      <div>
        <FilterLabel>Year range</FilterLabel>
        <div className="flex items-center gap-3">
          <select
            value={draft.yearMin}
            onChange={(e) => patch({ yearMin: Number(e.target.value) })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            {Array.from({ length: 22 }, (_, i) => 2005 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-400">to</span>
          <select
            value={draft.yearMax}
            onChange={(e) => patch({ yearMax: Number(e.target.value) })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            {Array.from({ length: 22 }, (_, i) => 2005 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FilterLabel>Price range (¥)</FilterLabel>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={draft.priceMin}
            onChange={(e) => patch({ priceMin: e.target.value })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <span className="text-xs text-zinc-400">to</span>
          <input
            type="number"
            placeholder="Max"
            value={draft.priceMax}
            onChange={(e) => patch({ priceMax: e.target.value })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div>
        <FilterLabel>Max mileage</FilterLabel>
        <MaxSlider
          min={0}
          max={1000000}
          step={5000}
          value={draft.mileageMax}
          onChange={(v) => patch({ mileageMax: v })}
          format={formatMileage}
        />
      </div>

      <div>
        <FilterLabel>Engine capacity</FilterLabel>
        <DualRangeSlider
          min={660}
          max={10000}
          step={50}
          valueMin={draft.engineMin}
          valueMax={draft.engineMax}
          onChange={([lo, hi]) => patch({ engineMin: lo, engineMax: hi })}
          format={formatEngine}
        />
      </div>
    </div>
  );
}

/* ---------- Filter chips ---------- */

function formatChipValue(key, value) {
  if (key === "priceMin" || key === "priceMax")
    return formatPrice(Number(value));
  if (key === "mileageMax") return formatMileage(Number(value));
  if (key === "engineMin" || key === "engineMax")
    return formatEngine(Number(value));
  return String(value);
}

function FilterChips({ filters, onRemove, onClearAll }) {
  const activeEntries = Object.entries(filters).filter(
    ([key, value]) => value !== "" && value !== DEFAULT_FILTERS[key],
  );

  if (activeEntries.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-1 pt-3 [scrollbar-width:none]">
      {activeEntries.map(([key, value]) => (
        <span
          key={key}
          className="font-ui flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 py-1.5 pl-3 pr-2 text-xs font-medium text-zinc-700"
        >
          <span className="text-zinc-400">{CHIP_LABELS[key]}:</span>
          {formatChipValue(key, value)}
          <button
            onClick={() => onRemove(key)}
            aria-label={`Remove ${CHIP_LABELS[key]}`}
          >
            <X className="h-3 w-3 text-zinc-500" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="font-ui shrink-0 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600"
      >
        Clear all
      </button>
    </div>
  );
}

/* ---------- Vehicle card ---------- */

function VehicleThumb({ className = "" }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 ${className}`}
    >
      <Car className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
    </div>
  );
}

function VehicleCard({ vehicle }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="relative">
        <VehicleThumb className="h-40 w-full" />
        <div className="absolute left-2.5 top-2.5">
          {vehicle.status === "live" ? (
            <span className="font-ui tabular-nums inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-2 py-1 text-[10px] font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <Clock className="h-3 w-3" /> {vehicle.countdownLabel}
            </span>
          ) : (
            <span className="font-ui rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-zinc-600">
              {vehicle.lotNo}
            </span>
          )}
        </div>
        <button
          onClick={() => setSaved((s) => !s)}
          className="absolute right-2.5 top-2.5 rounded-full bg-white/90 p-1.5"
          aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Heart
            className={`h-4 w-4 ${saved ? "fill-orange-600 text-orange-600" : "text-zinc-500"}`}
          />
        </button>
      </div>

      <div className="px-3.5 py-3">
        <p className="font-display text-sm font-semibold text-zinc-900">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="font-ui flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
            <Gauge className="h-3 w-3" /> {formatMileage(vehicle.mileage)}
          </span>
          <span className="font-ui flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
            <Fuel className="h-3 w-3" /> {vehicle.fuelType}
          </span>
          <span className="font-ui rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
            {vehicle.transmission}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-ui text-[11px] text-zinc-400">FOB price</p>
            <p className="font-display tabular-nums text-base font-semibold text-zinc-900">
              {formatPrice(vehicle.price)}
            </p>
          </div>
          <button className="font-ui rounded-lg bg-black px-3.5 py-2 text-xs font-semibold text-white">
            {vehicle.status === "live" ? "Place bid" : "View"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="h-40 w-full animate-pulse bg-zinc-100" />
      <div className="space-y-2 px-3.5 py-3">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}

function EmptyState({ onClearAll }) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <Car className="h-9 w-9 text-zinc-300" strokeWidth={1.5} />
      <p className="font-ui mt-3 text-sm text-zinc-500">
        No vehicles match your filters.
      </p>
      <button
        onClick={onClearAll}
        className="font-ui mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
      >
        Clear filters
      </button>
    </div>
  );
}

/* ---------- Top bar ---------- */

function ShopTopBar({ activeCount, onOpenFilters }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-6">
      {/* <button className="rounded-full bg-zinc-100 p-2" aria-label="Go back">
        <ChevronLeft className="h-4.5 w-4.5 text-zinc-700" />
      </button> */}
      <h1 className="font-display flex-1 text-base font-semibold text-zinc-900">
        Browse Vehicles
      </h1>
      <button
        onClick={onOpenFilters}
        className="relative rounded-full bg-zinc-100 p-2.5"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-4 w-4 text-zinc-700" />
        {activeCount > 0 && (
          <span className="font-ui absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}

function SearchSortRow({
  query,
  onQueryChange,
  sortDir,
  onToggleSort,
  resultCount,
}) {
  return (
    <div className="mt-4 flex items-center gap-2 px-5">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search make or model"
          className="font-ui w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
        />
      </div>
      <button
        onClick={onToggleSort}
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white"
        aria-label={
          sortDir === "asc" ? "Sorted low to high" : "Sorted high to low"
        }
      >
        <ArrowUpDown
          className={`h-4 w-4 ${sortDir === "asc" ? "text-orange-600" : "text-zinc-600"}`}
        />
      </button>
    </div>
  );
}

/* ---------- Root ---------- */

const PAGE_SIZE = 6;

export default function ShopScreen() {
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // Avoids SSR/CSR mismatch since mock data uses randomized values
  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    let list = ALL_VEHICLES.filter((v) => {
      if (filters.source && v.source !== filters.source) return false;
      if (filters.make && v.make !== filters.make) return false;
      if (filters.model && v.model !== filters.model) return false;
      if (v.year < filters.yearMin || v.year > filters.yearMax) return false;
      if (filters.priceMin && v.price < Number(filters.priceMin)) return false;
      if (filters.priceMax && v.price > Number(filters.priceMax)) return false;
      if (v.mileage > filters.mileageMax) return false;
      if (v.engineCc < filters.engineMin || v.engineCc > filters.engineMax)
        return false;
      if (
        query &&
        !`${v.make} ${v.model}`.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      return true;
    });
    list = [...list].sort((a, b) =>
      sortDir === "asc" ? a.price - b.price : b.price - a.price,
    );
    return list;
  }, [filters, query, sortDir]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset pagination whenever the result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters, query, sortDir]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    // Simulated network delay — swap for real page fetch later
    setTimeout(() => {
      setVisibleCount((v) => v + PAGE_SIZE);
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const activeCount = Object.entries(filters).filter(
    ([key, value]) => value !== "" && value !== DEFAULT_FILTERS[key],
  ).length;

  const openFilters = () => {
    setDraft(filters);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setFilters(draft);
    setSheetOpen(false);
  };

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setDraft(DEFAULT_FILTERS);
    setSheetOpen(false);
  };

  const removeChip = (key) => {
    setFilters((prev) => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <StyleBlock />

      <ShopTopBar activeCount={activeCount} onOpenFilters={openFilters} />
      <SearchSortRow
        query={query}
        onQueryChange={setQuery}
        sortDir={sortDir}
        onToggleSort={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        resultCount={filtered.length}
      />
      <FilterChips
        filters={filters}
        onRemove={removeChip}
        onClearAll={clearAll}
      />

      <p className="font-ui px-5 pb-1 pt-3 text-xs text-zinc-400">
        {mounted ? `${filtered.length} vehicles found` : "Loading…"}
      </p>

      <div className="grid grid-cols-1 gap-3 px-5 pb-6 pt-2">
        {!mounted ? (
          Array.from({ length: 4 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))
        ) : visible.length === 0 ? (
          <EmptyState onClearAll={clearAll} />
        ) : (
          <>
            {visible.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
            {loadingMore &&
              Array.from({ length: 2 }).map((_, i) => (
                <VehicleCardSkeleton key={`more-${i}`} />
              ))}
          </>
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={sentinelRef} className="h-1 w-full" />

      {/* Extra bottom padding to clear the universal tab bar */}
      <div className="h-20" />

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-3">
            <button
              onClick={clearAll}
              className="font-ui flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700"
            >
              Clear all
            </button>
            <button
              onClick={applyFilters}
              className="font-ui flex-1 rounded-xl bg-[#02ab86] py-3 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
          </div>
        }
      >
        <FilterSheetContent draft={draft} setDraft={setDraft} />
      </BottomSheet>
    </div>
  );
}
