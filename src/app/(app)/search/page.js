"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import useGet from "@/customHooks/useGet";
import { useCurrency } from "@/context/CurrencyContext";
import { formatPrice } from "@/utils/formatPrice";
/* ------------------------------------------------------------------ */
/*  Wired to the real endpoints from CarsShopComponent / AuctionSidebar-*/
/*  Filters / AuctionGrid:                                              */
/*    GET /vehicles/filters                    (filter options)         */
/*    GET /vehicles/filters/models/{make}       (dependent model list)   */
/*    GET /vehicles?{queryString}               (listings, paginated)   */
/*                                                                       */
/*  DEVIATIONS FROM WEB, FLAGGED EXPLICITLY:                            */
/*  1. No URL query-string sync (getFiltersFromURL/pushToURL). Filters   */
/*     live in local component state only. Mobile has no back/forward   */
/*     browser buttons to support, and TAB_ROOTS/BackToHomeGuard back-   */
/*     button logic already treats sub-screens as "pop" rather than      */
/*     relying on URL state — so I skipped this rather than fight the    */
/*     two systems. Say the word if you want it added back.              */
/*  2. Pagination is real server pagination (page-based, via /vehicles'  */
/*     meta.last_page), accumulated client-side as the user scrolls —    */
/*     replaces the old mock's client-side array slicing.                */
/*  3. sort_by is only ever set to price_jpy/price_usd (mirroring web's  */
/*     handleSortDirToggle — the sort_by dropdown is commented out on    */
/*     web too). No currency context wired yet, so this defaults to      */
/*     price_usd — flagged below, swap in useCurrency() once available.  */
/*  4. condition / transmission / fuel_type option lists: web's           */
/*     /vehicles/filters response shape for these wasn't shown to me —   */
/*     ASSUMED to mirror source_type's shape (array of {value}). Fix     */
/*     the field names below once you check the real payload.            */
/*  5. Vehicle listing fields (make, model, year, mileage, avg_price_jpy,*/
/*     avg_price_usd, body_type, transmission, fuel_type, main_image,    */
/*     status, type, countdown, lotNo, slug/id) are taken directly from  */
/*     AuctionCard.jsx — confirmed shape, not a guess.                   */
/* ------------------------------------------------------------------ */

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }

    .range-input {
      -webkit-appearance: none; appearance: none; position: absolute;
      width: 100%; height: 4px; background: transparent; pointer-events: none; margin: 0;
    }
    .range-input::-webkit-slider-thumb {
      -webkit-appearance: none; pointer-events: auto; width: 18px; height: 18px;
      border-radius: 9999px; background: #fff; border: 2.5px solid #18181b;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2); cursor: pointer; margin-top: -7px;
    }
    .range-input::-moz-range-thumb {
      pointer-events: auto; width: 18px; height: 18px; border-radius: 9999px;
      background: #fff; border: 2.5px solid #18181b; cursor: pointer;
    }
    .range-input::-webkit-slider-runnable-track { height: 4px; background: transparent; }
  `}</style>
);

const ENGINE_MIN = 660;
const ENGINE_MAX = 10000;
const PER_PAGE = 15; // matches web's default per_page

const DEFAULT_FILTERS = {
  source_type: "",
  make: "",
  model: "",
  year_min: "",
  year_max: "",
  price_min: "",
  price_max: "",
  mileage_max: 1000000,
  engine_min: ENGINE_MIN,
  engine_max: ENGINE_MAX,
  condition: "",
  transmission: "",
  fuel_type: "",
  sort_by: "",
  sort_dir: "desc",
};

const CHIP_LABELS = {
  source_type: "Source",
  make: "Make",
  model: "Model",
  year_min: "Year from",
  year_max: "Year to",
  price_min: "Min price",
  price_max: "Max price",
  mileage_max: "Max mileage",
  engine_min: "Min engine",
  engine_max: "Max engine",
  condition: "Condition",
  transmission: "Transmission",
  fuel_type: "Fuel",
};

/* Same param list as buildQueryString on web, so the API sees an
   identical query shape regardless of which client sent it. */
const PARAM_KEYS = [
  "source_type",
  "make",
  "model",
  "year_min",
  "year_max",
  "mileage_max",
  "price_min",
  "price_max",
  "condition",
  "sort_by",
  "sort_dir",
  "search",
  "transmission",
  "fuel_type",
  "engine_min",
  "engine_max",
];

function buildQueryString(filters, page) {
  const params = new URLSearchParams();
  PARAM_KEYS.forEach((key) => {
    const val = filters[key];
    if (val !== undefined && val !== null && val !== "")
      params.append(key, val);
  });
  params.set("page", page ?? 1);
  params.set("per_page", PER_PAGE);
  return params.toString();
}

/* ---------- Formatting ---------- */

const formatMileage = (km) => `${(km / 1000).toFixed(0)}k km`;
const formatEngine = (cc) =>
  cc >= 1000 ? `${(cc / 1000).toFixed(1)}L` : `${cc}cc`;

function formatChipValue(key, value) {
  if (key === "mileage_max") return formatMileage(Number(value));
  if (key === "price_min" || key === "price_max")
    return `$${Number(value).toLocaleString()}`;
  if (key === "engine_min" || key === "engine_max")
    return formatEngine(Number(value));
  return String(value);
}

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

/* ---------- Sliders ---------- */

function DualRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  format,
}) {
  const handleMinChange = (e) =>
    onChange([Math.min(Number(e.target.value), valueMax - step), valueMax]);
  const handleMaxChange = (e) =>
    onChange([valueMin, Math.max(Number(e.target.value), valueMin + step)]);
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
          value === "" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
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

/* ---------- Auction Days / Houses (mobile version of AuctionDaysHousesFilter) ---------- */

function AuctionDaysHousesFilter({
  auctionDays,
  selectedDate,
  selectedHouses,
  onDayChange,
  onHouseToggle,
}) {
  const houseList = useMemo(() => {
    if (!auctionDays?.length) return [];
    if (!selectedDate) {
      const merged = new Map();
      auctionDays.forEach((d) =>
        d.houses.forEach((h) =>
          merged.set(h.name, (merged.get(h.name) || 0) + h.count),
        ),
      );
      return Array.from(merged, ([name, count]) => ({ name, count })).sort(
        (a, b) => b.count - a.count,
      );
    }
    const day = auctionDays.find((d) => d.date === selectedDate);
    return day ? [...day.houses].sort((a, b) => b.count - a.count) : [];
  }, [auctionDays, selectedDate]);

  if (!auctionDays?.length) return null;

  const totalFor = (date) => {
    if (!date)
      return auctionDays.reduce(
        (sum, d) => sum + d.houses.reduce((s, h) => s + h.count, 0),
        0,
      );
    const day = auctionDays.find((d) => d.date === date);
    return day ? day.houses.reduce((s, h) => s + h.count, 0) : 0;
  };

  return (
    <div>
      <FilterLabel>Auction days</FilterLabel>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button
          onClick={() => onDayChange("")}
          className={`font-ui shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
            !selectedDate
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          All ({totalFor("")})
        </button>
        {auctionDays.map((d) => (
          <button
            key={d.date}
            onClick={() => onDayChange(d.date)}
            className={`font-ui shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              selectedDate === d.date
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {d.day} ({totalFor(d.date)})
          </button>
        ))}
      </div>

      {houseList.length > 0 && (
        <div className="mt-3 max-h-52 space-y-1 overflow-y-auto">
          {houseList.map((h) => (
            <label
              key={h.name}
              className="font-ui flex items-center justify-between gap-2 py-1.5"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedHouses.includes(h.name)}
                  onChange={() => onHouseToggle(h.name)}
                  className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                />
                <span className="text-sm text-zinc-700">{h.name}</span>
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                {h.count}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Filter sheet content ---------- */

function FilterSheetContent({
  draft,
  setDraft,
  filtersData,
  filtersLoading,
  auctionDayDraft,
  setAuctionDayDraft,
}) {
  const patch = (updates) => setDraft((prev) => ({ ...prev, ...updates }));

  const makes = filtersData?.makes?.map((m) => m.make) ?? [];
  const sourceTypes = filtersData?.source_type?.map((s) => s.value) ?? [];
  // ASSUMPTION — see file header note 4. Confirm real field shape.
  const conditions = filtersData?.condition?.map((c) => c.value) ?? [];
  const transmissions = filtersData?.transmission?.map((t) => t.value) ?? [];
  const fuelTypes = filtersData?.fuel_type?.map((f) => f.value) ?? [];

  const { data: modelsResponse, loading: modelsLoading } = useGet(
    `/vehicles/filters/models/${encodeURIComponent(draft.make || "")}`,
    !!draft.make,
    false,
  );
  const models = useMemo(() => {
    const list = modelsResponse?.data ?? [];
    return list.map((m) => (typeof m === "string" ? m : m.model));
  }, [modelsResponse]);

  const yearOptions = useMemo(() => {
    const yearMin = filtersData?.year_min ?? 1990;
    const yearMax = filtersData?.year_max ?? 2026;
    return Array.from({ length: yearMax - yearMin + 1 }, (_, i) =>
      String(yearMax - i),
    );
  }, [filtersData?.year_min, filtersData?.year_max]);

  const handleDayChange = (date) => {
    if (!date) {
      setAuctionDayDraft({ date: "", houses: [] });
      return;
    }
    const day = filtersData?.auction_days?.find((d) => d.date === date);
    setAuctionDayDraft({
      date,
      houses: day ? day.houses.map((h) => h.name) : [],
    });
  };
  const handleHouseToggle = (name) => {
    setAuctionDayDraft((prev) => ({
      ...prev,
      houses: prev.houses.includes(name)
        ? prev.houses.filter((h) => h !== name)
        : [...prev.houses, name],
    }));
  };

  if (filtersLoading) {
    return (
      <p className="font-ui py-8 text-center text-sm text-zinc-400">
        Loading filters…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {sourceTypes.length > 0 && (
        <div>
          <FilterLabel>Source</FilterLabel>
          <ChipSelect
            options={sourceTypes}
            value={draft.source_type}
            onChange={(v) => patch({ source_type: v })}
          />
        </div>
      )}

      {makes.length > 0 && (
        <div>
          <FilterLabel>Make</FilterLabel>
          <ChipSelect
            options={makes}
            value={draft.make}
            allLabel="Any make"
            onChange={(v) => patch({ make: v, model: "" })}
          />
        </div>
      )}

      {draft.make && (
        <div>
          <FilterLabel>Model</FilterLabel>
          {modelsLoading ? (
            <p className="font-ui text-xs text-zinc-400">Loading models…</p>
          ) : (
            <ChipSelect
              options={models}
              value={draft.model}
              allLabel="Any model"
              onChange={(v) => patch({ model: v })}
            />
          )}
        </div>
      )}

      <div>
        <FilterLabel>Year range</FilterLabel>
        <div className="flex items-center gap-3">
          <select
            value={draft.year_min}
            onChange={(e) => patch({ year_min: e.target.value })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            <option value="">From</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-400">to</span>
          <select
            value={draft.year_max}
            onChange={(e) => patch({ year_max: e.target.value })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            <option value="">To</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FilterLabel>Price range ($)</FilterLabel>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={draft.price_min}
            onChange={(e) => patch({ price_min: e.target.value })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <span className="text-xs text-zinc-400">to</span>
          <input
            type="number"
            placeholder="Max"
            value={draft.price_max}
            onChange={(e) => patch({ price_max: e.target.value })}
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
          value={draft.mileage_max}
          onChange={(v) => patch({ mileage_max: v })}
          format={formatMileage}
        />
      </div>

      <div>
        <FilterLabel>Engine capacity</FilterLabel>
        <DualRangeSlider
          min={ENGINE_MIN}
          max={ENGINE_MAX}
          step={50}
          valueMin={draft.engine_min}
          valueMax={draft.engine_max}
          onChange={([lo, hi]) => patch({ engine_min: lo, engine_max: hi })}
          format={formatEngine}
        />
      </div>

      {conditions.length > 0 && (
        <div>
          <FilterLabel>Condition</FilterLabel>
          <ChipSelect
            options={conditions}
            value={draft.condition}
            onChange={(v) => patch({ condition: v })}
          />
        </div>
      )}

      {transmissions.length > 0 && (
        <div>
          <FilterLabel>Transmission</FilterLabel>
          <ChipSelect
            options={transmissions}
            value={draft.transmission}
            onChange={(v) => patch({ transmission: v })}
          />
        </div>
      )}

      {fuelTypes.length > 0 && (
        <div>
          <FilterLabel>Fuel type</FilterLabel>
          <ChipSelect
            options={fuelTypes}
            value={draft.fuel_type}
            onChange={(v) => patch({ fuel_type: v })}
          />
        </div>
      )}

      {filtersData?.auction_days?.length > 0 && (
        <AuctionDaysHousesFilter
          auctionDays={filtersData.auction_days}
          selectedDate={auctionDayDraft.date}
          selectedHouses={auctionDayDraft.houses}
          onDayChange={handleDayChange}
          onHouseToggle={handleHouseToggle}
        />
      )}
    </div>
  );
}

/* ---------- Filter chips ---------- */

function FilterChips({
  filters,
  auctionDayFilter,
  onRemove,
  onClearAuctionDay,
  onClearAll,
}) {
  const activeEntries = Object.entries(filters).filter(
    ([key, value]) =>
      !["sort_by", "sort_dir"].includes(key) &&
      value !== "" &&
      value !== DEFAULT_FILTERS[key],
  );

  const hasAuctionDay = !!auctionDayFilter.date;
  if (activeEntries.length === 0 && !hasAuctionDay) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-1 pt-3 [scrollbar-width:none]">
      {activeEntries.map(([key, value]) => (
        <span
          key={key}
          className="font-ui flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 py-1.5 pl-3 pr-2 text-xs font-medium text-zinc-700"
        >
          <span className="text-zinc-400">{CHIP_LABELS[key] ?? key}:</span>
          {formatChipValue(key, value)}
          <button
            onClick={() => onRemove(key)}
            aria-label={`Remove ${CHIP_LABELS[key] ?? key}`}
          >
            <X className="h-3 w-3 text-zinc-500" />
          </button>
        </span>
      ))}
      {hasAuctionDay && (
        <span className="font-ui flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 py-1.5 pl-3 pr-2 text-xs font-medium text-zinc-700">
          <span className="text-zinc-400">Auction day:</span>
          {auctionDayFilter.date}
          <button
            onClick={onClearAuctionDay}
            aria-label="Remove auction day filter"
          >
            <X className="h-3 w-3 text-zinc-500" />
          </button>
        </span>
      )}
      <button
        onClick={onClearAll}
        className="font-ui shrink-0 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600"
      >
        Clear all
      </button>
    </div>
  );
}

/* ---------- Vehicle card (real fields from AuctionCard.jsx) ---------- */

function VehicleThumb({ className = "" }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 ${className}`}
    >
      <Car className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
    </div>
  );
}

function VehicleCard({ vehicle, onOpen }) {
  const title = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
  const isLive = vehicle.status === "live";
  const [saved, setSaved] = useState(false);
  const { currency } = useCurrency();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(vehicle)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(vehicle);
      }}
      className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white"
    >
      <div className="relative">
        {vehicle.main_image ? (
          <img
            src={vehicle.main_image}
            alt={title}
            className="h-40 w-full object-cover"
          />
        ) : (
          <VehicleThumb className="h-40 w-full" />
        )}
        <div className="absolute left-2.5 top-2.5">
          {isLive ? (
            <span className="font-ui inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-2 py-1 text-[10px] font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <Clock className="h-3 w-3" /> Live
            </span>
          ) : (
            <span className="font-ui rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-zinc-600">
              {vehicle.lotNo ?? vehicle.status}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          className="absolute right-2.5 top-2.5 rounded-full bg-white/90 p-1.5"
          aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Heart
            className={`h-4 w-4 ${
              saved ? "fill-orange-600 text-orange-600" : "text-zinc-500"
            }`}
          />
        </button>
      </div>

      <div className="px-3.5 py-3">
        <p className="font-display text-sm font-semibold text-zinc-900">
          {title}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {vehicle.mileage != null && (
            <span className="font-ui flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
              <Gauge className="h-3 w-3" />{" "}
              {Number(vehicle.mileage).toLocaleString()} km
            </span>
          )}
          {vehicle.fuel_type && (
            <span className="font-ui flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
              <Fuel className="h-3 w-3" /> {vehicle.fuel_type}
            </span>
          )}
          {vehicle.transmission && (
            <span className="font-ui rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
              {vehicle.transmission}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-ui text-[11px] text-zinc-400">Car price</p>
            <p className="font-display tabular-nums text-base font-semibold text-zinc-900">
              {formatPrice(vehicle, currency)}{" "}
            </p>
          </div>
          <span className="font-ui rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white">
            Place bid
          </span>
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

function ShopTopBar({ activeCount, onBack, onOpenFilters }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-6">
      <button
        onClick={onBack}
        className="rounded-full bg-zinc-100 p-2"
        aria-label="Go back"
      >
        <ChevronLeft className="h-4.5 w-4.5 text-zinc-700" />
      </button>
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
  onSubmitSearch,
  sortDir,
  onToggleSort,
}) {
  return (
    <div className="mt-4 flex items-center gap-2 px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitSearch(query);
        }}
        className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5"
      >
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search make or model"
          className="font-ui w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
        />
      </form>
      <button
        onClick={onToggleSort}
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white"
        aria-label={
          sortDir === "asc" ? "Sorted low to high" : "Sorted high to low"
        }
      >
        <ArrowUpDown
          className={`h-4 w-4 ${
            sortDir === "asc" ? "text-orange-600" : "text-zinc-600"
          }`}
        />
      </button>
    </div>
  );
}

/* ---------- Root ---------- */

export default function ShopScreen({ initialMake = "", initialModel = "" }) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === "authenticated";

  const [sheetOpen, setSheetOpen] = useState(false);
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    make: initialMake,
    model: initialModel,
  });
  const [draft, setDraft] = useState(filters);
  const [auctionDayFilter, setAuctionDayFilter] = useState({
    date: "",
    houses: [],
  });
  const [auctionDayDraft, setAuctionDayDraft] = useState(auctionDayFilter);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);
  const sentinelRef = useRef(null);

  const {
    data: filtersResponse,
    loading: filtersLoading,
    error: filtersError,
  } = useGet("/vehicles/filters", true, false);
  const filtersData = filtersResponse?.data ?? null;

  // Build the API query string — same param set as web's buildQueryString,
  // plus auction_date/auction_house merged in like web's apiQueryString.
  const apiQueryString = useMemo(() => {
    const activeFilters = { ...filters, search: query || undefined, page };
    const qs = buildQueryString(activeFilters, page);
    const params = new URLSearchParams(qs);
    if (auctionDayFilter.date)
      params.set("auction_date", auctionDayFilter.date);
    if (auctionDayFilter.houses.length > 0)
      params.set("auction_house", auctionDayFilter.houses.join(","));
    return params.toString();
  }, [filters, query, page, auctionDayFilter]);

  const {
    data: vehiclesResponse,
    loading: vehiclesLoading,
    error: vehiclesError,
    refetch,
  } = useGet(`/vehicles?${apiQueryString}`, true, false);

  const vehicles = vehiclesResponse?.data?.data ?? [];
  const meta = vehiclesResponse?.data?.meta ?? null;
  const lastPage = meta?.last_page ?? 1;
  const hasMore = page < lastPage;
  // Reset accumulated list to page 1 whenever filters/search/sort change
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [filters, query, auctionDayFilter]);

  // Append each fetched page's results to the accumulated list
  useEffect(() => {
    if (!vehicles.length) return;
    setAccumulated((prev) => {
      if (page === 1) return vehicles;
      const existingIds = new Set(prev.map((v) => v.slug ?? v.id));
      const fresh = vehicles.filter((v) => !existingIds.has(v.slug ?? v.id));
      return [...prev, ...fresh];
    });
  }, [vehiclesResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (vehiclesLoading || !hasMore) return;
    setPage((p) => p + 1);
  }, [vehiclesLoading, hasMore]);

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

  const activeCount =
    Object.entries(filters).filter(
      ([key, value]) =>
        !["sort_by", "sort_dir"].includes(key) &&
        value !== "" &&
        value !== DEFAULT_FILTERS[key],
    ).length + (auctionDayFilter.date ? 1 : 0);

  const openFilters = () => {
    setDraft(filters);
    setAuctionDayDraft(auctionDayFilter);
    setSheetOpen(true);
  };
  const applyFilters = () => {
    setFilters(draft);
    setAuctionDayFilter(auctionDayDraft);
    setSheetOpen(false);
  };
  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setDraft(DEFAULT_FILTERS);
    setAuctionDayFilter({ date: "", houses: [] });
    setAuctionDayDraft({ date: "", houses: [] });
    setSheetOpen(false);
  };
  const removeChip = (key) =>
    setFilters((prev) => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  const clearAuctionDay = () => setAuctionDayFilter({ date: "", houses: [] });

  const handleToggleSort = () => {
    const nextDir = filters.sort_dir === "asc" ? "desc" : "asc";
    // ASSUMPTION — see file header note 3: defaults to price_usd since no
    // currency context is wired here yet. Swap for useCurrency() once
    // available, matching web's currency-driven sort_by swap.
    setFilters((prev) => ({
      ...prev,
      sort_dir: nextDir,
      sort_by: "price_usd",
    }));
  };

  const handleOpenVehicle = (vehicle) => {
    const href = `/${vehicle.type}/${
      vehicle.type === "auction" ? vehicle.id : vehicle.slug
    }`;
    // if (!isLoggedIn) {
    //   router.push(`/login?redirect=${encodeURIComponent(href)}`);
    //   return;
    // }
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 font-sans">
      <StyleBlock />

      <ShopTopBar
        activeCount={activeCount}
        onBack={() => router.back()}
        onOpenFilters={openFilters}
      />
      <SearchSortRow
        query={query}
        onQueryChange={setQuery}
        onSubmitSearch={setQuery}
        sortDir={filters.sort_dir}
        onToggleSort={handleToggleSort}
      />
      <FilterChips
        filters={filters}
        auctionDayFilter={auctionDayFilter}
        onRemove={removeChip}
        onClearAuctionDay={clearAuctionDay}
        onClearAll={clearAll}
      />

      {filtersError && (
        <p className="font-ui mx-5 mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
          Could not load filter options.
        </p>
      )}

      <p className="font-ui px-5 pb-1 pt-3 text-xs text-zinc-400">
        {vehiclesLoading && page === 1
          ? "Loading…"
          : meta
          ? `${meta.total} vehicles found`
          : ""}
      </p>

      <div className="grid grid-cols-1 gap-3 px-5 pb-6 pt-2">
        {vehiclesError ? (
          <p className="font-ui rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
            Failed to load vehicles.{" "}
            <button onClick={refetch} className="font-semibold underline">
              Retry
            </button>
          </p>
        ) : vehiclesLoading && page === 1 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))
        ) : accumulated.length === 0 ? (
          <EmptyState onClearAll={clearAll} />
        ) : (
          <>
            {accumulated.map((vehicle) => (
              <VehicleCard
                key={vehicle.slug ?? vehicle.id}
                vehicle={vehicle}
                onOpen={handleOpenVehicle}
              />
            ))}
            {vehiclesLoading &&
              page > 1 &&
              Array.from({ length: 2 }).map((_, i) => (
                <VehicleCardSkeleton key={`more-${i}`} />
              ))}
          </>
        )}
      </div>

      <div ref={sentinelRef} className="h-1 w-full" />
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
              className="font-ui flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
          </div>
        }
      >
        <FilterSheetContent
          draft={draft}
          setDraft={setDraft}
          filtersData={filtersData}
          filtersLoading={filtersLoading}
          auctionDayDraft={auctionDayDraft}
          setAuctionDayDraft={setAuctionDayDraft}
        />
      </BottomSheet>
    </div>
  );
}
