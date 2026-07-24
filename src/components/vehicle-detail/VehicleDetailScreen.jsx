"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { themeColors } from "@/theme/themeColors";
import {
  ChevronLeft,
  Search,
  Layers,
  Ship,
  Car,
  Landmark,
  CreditCard,
  Wallet,
  CircleDollarSign,
  FileText,
  Download,
  Clock,
  Gauge,
  Fuel,
  Palette,
} from "lucide-react";
import useGet from "@/customHooks/useGet";
import OrderFormSheet from "./OrderFormSheet";

/* ------------------------------------------------------------------ */
/*  Maps CarDetailComponent's sections onto one mobile scroll screen:  */
/*                                                                      */
/*  Web                     →  Mobile                                  */
/*  AuctionImageGallery     →  ImageGallery + VehicleHeader + specs      */
/*  AuctionReport           →  AuctionReportSection (auction type only)  */
/*  OrderFlow               →  OrderFlowSection (static, both types)     */
/*  OrderForm/InquiryForm   →  sticky CTA → OrderFormSheet (full screen) */
/*  CarRow                  →  RelatedVehiclesRow                        */
/*                                                                      */
/*  ASSUMPTIONS TO VERIFY:                                              */
/*  1. Vehicle fetch mirrors web's fetchVehicle() — GET                 */
/*     /vehicles/auction/{id} or /vehicles/company/{id}, no auth        */
/*     required, matching the plain fetch() on web's page.js.           */
/*  2. buildInfoRows() is now a faithful port of utils/TableUtils.js     */
/*     (confirmed source). It intentionally drops color/body_type/       */
/*     transmission/engine/mileage — commented out on web too, and       */
/*     already shown separately in SpecsRow above.                       */
/*  3. useCountdownTimer is now a faithful port (confirmed hook shape,    */
/*     zero-padded string fields); calculateTimeRemaining()'s own source */
/*     wasn't shared but this reproduces the same output format.         */
/*  4. Currency: no CurrencyContext exists in the mobile app yet, so      */
/*     this defaults to USD throughout (formatPrice + buildInfoRows both  */
/*     hardcode "usd"). Swap for useCurrency() once that context is       */
/*     ported to mobile.                                                 */
/* ------------------------------------------------------------------ */

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

/* ---------- Countdown — ported from useCountdownTimer.js ---------- */
/* calculateTimeRemaining()'s own source wasn't shared, but the hook's   */
/* shape (zero-padded string fields, 1s interval) is confirmed — this    */
/* reproduces that same output format from a plain ms diff.              */

function pad(n) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function calculateTimeRemaining(endTime) {
  if (!endTime)
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  return {
    days: pad(Math.floor(diff / 86400000)),
    hours: pad(Math.floor((diff % 86400000) / 3600000)),
    minutes: pad(Math.floor((diff % 3600000) / 60000)),
    seconds: pad(Math.floor((diff % 60000) / 1000)),
  };
}

function useCountdownTimer(endTime) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    calculateTimeRemaining(endTime),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeRemaining;
}

function formatPrice(vehicle) {
  // ASSUMPTION — defaults to USD, no currency context wired yet (note #4).
  if (vehicle?.price_usd != null)
    return `$${Number(vehicle.price_usd).toLocaleString()}`;
  if (vehicle?.price_jpy != null)
    return `¥${Number(vehicle.price_jpy).toLocaleString()}`;
  return "Price on request";
}

/* ---------- Image gallery ---------- */

function ImageGallery({ vehicle, title }) {
  const images = useMemo(() => {
    const all = [vehicle?.main_image, ...(vehicle?.images ?? [])].filter(
      Boolean,
    );
    return all.length > 0 ? [...new Set(all)] : [];
  }, [vehicle]);

  const [activeIdx, setActiveIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
        <Car className="h-10 w-10 text-zinc-400" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-72 w-full bg-zinc-100">
        <img
          src={images[activeIdx]}
          alt={`${title} image ${activeIdx + 1}`}
          className="h-full w-full object-cover"
        />
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIdx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none]">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === activeIdx ? "border-zinc-900" : "border-transparent"
              }`}
            >
              <img
                src={src}
                alt={`${title} thumb ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Header / specs / price ---------- */

function VehicleHeader({ vehicle, title }) {
  return (
    <div className="px-5 pt-4">
      <span
        className={`font-ui inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          vehicle.lot_number
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-600"
        }`}
      >
        {vehicle.lot_number
          ? `Lot # ${vehicle.lot_number}`
          : vehicle.status ?? "Available"}
      </span>
      <h1 className="font-display mt-2 text-xl font-semibold text-zinc-900">
        {title}
      </h1>
      {vehicle.description && (
        <p className="font-ui mt-1.5 text-sm leading-relaxed text-zinc-500">
          {vehicle.description}
        </p>
      )}
    </div>
  );
}

function SpecsRow({ vehicle }) {
  const specs = [
    vehicle.engine && {
      icon: Gauge,
      label: "Engine",
      value: `${vehicle.engine} cc`,
    },
    vehicle.transmission && {
      icon: Layers,
      label: "Transmission",
      value: vehicle.transmission,
    },
    vehicle.fuel_type && {
      icon: Fuel,
      label: "Fuel",
      value: vehicle.fuel_type,
    },
    vehicle.color && { icon: Palette, label: "Color", value: vehicle.color },
    vehicle.mileage != null && {
      icon: Gauge,
      label: "Mileage",
      value: `${Number(vehicle.mileage).toLocaleString()} km`,
    },
    vehicle.body_type && { icon: Car, label: "Body", value: vehicle.body_type },
  ].filter(Boolean);

  if (specs.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-3 gap-2.5 px-5">
      {specs.map((s) => (
        <div
          key={s.label}
          className="rounded-xl bg-zinc-50 px-2.5 py-2.5 text-center"
        >
          <s.icon className="mx-auto h-4 w-4 text-zinc-400" />
          <p className="font-ui mt-1 text-[10px] text-zinc-400">{s.label}</p>
          <p className="font-ui truncate text-xs font-semibold text-zinc-900">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function PriceCountdownBar({ vehicle }) {
  const hasCountdown = !!vehicle.auction_start;
  const { days, hours, minutes, seconds } = useCountdownTimer(
    vehicle.auction_start,
  );

  return (
    <div className="mt-5 flex items-center justify-between border-y border-zinc-100 px-5 py-4">
      <div>
        <p className="font-ui text-xs text-zinc-400">Start price</p>
        <p className="font-display tabular-nums text-lg font-semibold text-zinc-900">
          {formatPrice(vehicle)}
        </p>
      </div>
      {hasCountdown && (
        <div className="text-right">
          <p className="font-ui text-xs text-zinc-400">Auction ends in</p>
          <p className="font-display tabular-nums flex items-center gap-1 text-sm font-semibold text-zinc-900">
            <Clock className="h-3.5 w-3.5 text-orange-600" />
            {days}d {hours}h {minutes}m {seconds}s
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- Info table — ported from utils/TableUtils.js buildInfoRows() ---------- */
/* ASSUMPTION #4 still applies: currency hardcoded to "usd" here since no  */
/* CurrencyContext exists on mobile yet. Swap the literal below for        */
/* useCurrency().currency once that context is ported.                    */

function buildInfoRows(vehicle, currency = "usd") {
  if (!vehicle) return [];

  const rows = [
    { label: "Type", value: vehicle.type },
    { label: "Slug / Stock", value: vehicle.slug },
    { label: "Make", value: vehicle.make },
    { label: "Model", value: vehicle.model },
    { label: "Year", value: vehicle.year },
    { label: "Variant", value: vehicle.variant },
    { label: "Trim", value: vehicle.trim },
    { label: "Fuel Type", value: vehicle.fuel_type },
    {
      label: "Horsepower",
      value: vehicle.horsepower ? `${vehicle.horsepower} hp` : null,
    },
    { label: "Drive", value: vehicle.drive },
    { label: "Steering", value: vehicle.steering },
    { label: "Grade", value: vehicle.grade },
    { label: "VIN / Stock #", value: vehicle.vin_or_stock_number },
    { label: "Lot Number", value: vehicle.lot_number },
    { label: "Auction House", value: vehicle.auction_house },
    {
      label: "Auction Start",
      value: vehicle.auction_start
        ? new Date(vehicle.auction_start).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
    },
    { label: "Location", value: vehicle.location },
    { label: "Status", value: vehicle.status },
    { label: "Equipment Codes", value: vehicle.equipment_codes },
    { label: "Info", value: vehicle.info },
    {
      label: "Car Price",
      value:
        currency === "usd"
          ? vehicle?.avg_price_usd
            ? `$${vehicle.avg_price_usd} FOB`
            : ""
          : vehicle?.avg_price_jpy
          ? `¥${vehicle.avg_price_jpy} FOB`
          : "",
    },
  ];

  return rows.filter((r) => r.value != null && r.value !== "");
}

function InfoTable({ vehicle }) {
  const rows = buildInfoRows(vehicle, "usd");
  if (rows.length === 0) return null;

  return (
    <div className="mt-5 border-t border-zinc-100 px-5 pt-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="font-ui flex justify-between border-b border-zinc-50 py-1.5 text-xs"
          >
            <span className="text-zinc-400">{label}</span>
            <span className="max-w-[55%] truncate text-right font-medium text-zinc-700">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Order flow (static, ported from OrderFlow.jsx) ---------- */

const ORDER_STEPS = [
  { icon: Search, step: "Step 1", label: "Select Vehicle" },
  { icon: Layers, step: "Step 2", label: "Make Payment" },
  { icon: Ship, step: "Step 3", label: "Track Order" },
  { icon: Car, step: "Step 4", label: "Receive Delivery" },
];
const PAYMENT_METHODS = [
  { icon: Landmark, label: "Bank Transfer" },
  { icon: CreditCard, label: "Credit/debit card" },
  { icon: Wallet, label: "PayPal" },
  { icon: CircleDollarSign, label: "CPEM Balance" },
];

function OrderFlowSection() {
  return (
    <div className="mt-6 px-5">
      <h2 className="font-display text-base font-semibold text-zinc-900">
        Order flow
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {ORDER_STEPS.map(({ icon: Icon, step, label }) => (
          <div key={step} className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <Icon className="h-4.5 w-4.5 text-zinc-900" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-ui text-[10px] text-zinc-400">{step}</p>
              <p className="font-ui text-xs font-semibold text-zinc-900">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display mt-6 text-base font-semibold text-zinc-900">
        Payment methods
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <Icon className="h-4.5 w-4.5 text-zinc-900" strokeWidth={1.75} />
            </span>
            <span className="font-ui text-xs font-semibold text-zinc-900">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Auction report (auction type only, ported from AuctionReport.jsx) ---------- */

const GRADE_SCALE = [
  { key: "5", label: "Grade 5: Perfect", bg: "#cdebd9", text: "#0f7a4a" },
  { key: "4.5", label: "Grade 4.5: Excellent", bg: "#fffdd3", text: "#b45309" },
  { key: "4", label: "Grade 4: Good", bg: "#b2c8f9", text: "#002c8a" },
  { key: "3.5", label: "Grade 3.5: Fair", bg: "#fdf1de", text: "#c2790f" },
  { key: "1-3", label: "Grade 1-3: Poor", bg: "#fbe2e2", text: "#c4302b" },
];

function AuctionReportSection({ vehicle }) {
  if (!vehicle.grade) return null;

  return (
    <div className="mt-6 px-5">
      <h2 className="font-display text-base font-semibold text-zinc-900">
        Auction report
      </h2>
      <p className="font-ui mt-1 text-xs text-zinc-500">
        Rating and condition scale for this {vehicle.make} {vehicle.model}.
      </p>

      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
        <div className="bg-zinc-900 p-4">
          <div className="flex items-center gap-2">
            <span className="font-ui text-xs font-semibold text-white">
              Rating:
            </span>
            <span className="font-ui rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-900">
              Grade {vehicle.grade}
            </span>
          </div>
          <p className="font-ui mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Scale
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {GRADE_SCALE.map((s) => (
              <span
                key={s.key}
                className="rounded-full py-1.5 text-center text-[10px] font-semibold"
                style={{ backgroundColor: s.bg, color: s.text }}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {vehicle.main_image && (
          <a
            href={vehicle.main_image}
            target="_blank"
            rel="noopener noreferrer"
            className="font-ui flex items-center justify-between bg-white px-4 py-3 text-xs font-semibold text-zinc-900"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Vehicle auction sheet
            </span>
            <Download className="h-4 w-4 text-zinc-400" />
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------- Related vehicles (ported from CarRow.jsx) ---------- */

function RelatedVehicleCard({ vehicle, onOpen }) {
  const title = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
  const isUpcoming = vehicle.status === "upcoming";

  return (
    <button
      onClick={() => onOpen(vehicle)}
      className="w-40 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white text-left"
    >
      {vehicle.main_image ? (
        <img
          src={vehicle.main_image}
          alt={title}
          className="h-24 w-full object-cover"
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center bg-zinc-100">
          <Car className="h-6 w-6 text-zinc-400" />
        </div>
      )}
      <div className="px-2.5 py-2.5">
        <p className="font-ui truncate text-xs font-medium text-zinc-900">
          {title}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="font-display tabular-nums text-xs font-semibold text-zinc-900">
            {formatPrice(vehicle)}
          </p>
          <span className="font-ui rounded-full bg-orange-600 px-2 py-1 text-[9px] font-semibold text-white">
            {isUpcoming ? "Notify" : "Bid"}
          </span>
        </div>
      </div>
    </button>
  );
}

function RelatedVehiclesRow({ vehicle, onOpen }) {
  const params = new URLSearchParams();
  if (vehicle?.make) params.set("make", vehicle.make);
  if (vehicle?.model) params.set("model", vehicle.model);
  if (vehicle?.id) params.set("exclude", vehicle.id);
  params.set("limit", "6");

  const { data, loading, error } = useGet(
    `/vehicles/related?${params.toString()}`,
    true,
    false,
  );
  const related = data?.data ?? [];

  if (loading) {
    return (
      <div className="mt-6 flex gap-3 overflow-x-auto px-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-36 w-40 shrink-0 animate-pulse rounded-xl bg-zinc-100"
          />
        ))}
      </div>
    );
  }

  if (error || related.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="font-display px-5 text-base font-semibold text-zinc-900">
        Related auctions
      </h2>
      <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {related.map((v) => (
          <RelatedVehicleCard key={v.id} vehicle={v} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Root ---------- */

export default function VehicleDetailScreen() {
  const router = useRouter();
  const params = useParams();
  const { type, id } = params;

  const [orderSheetOpen, setOrderSheetOpen] = useState(false);

  const endpoint =
    type === "auction" ? `/vehicles/auction/${id}` : `/vehicles/company/${id}`;
  const { data, loading, error } = useGet(endpoint, true, false);
  const vehicle = data?.data ?? null;

  const title = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
    : "";

  const handleOpenRelated = (relatedVehicle) => {
    router.push(`/${relatedVehicle.type ?? type}/${relatedVehicle.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans">
        <StyleBlock />
        <div className="h-72 w-full animate-pulse bg-zinc-100" />
        <div className="space-y-3 px-5 pt-5">
          <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
          <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-100" />
          <div className="h-20 w-full animate-pulse rounded bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center font-sans">
        <StyleBlock />
        <Car className="h-9 w-9 text-zinc-300" />
        <p className="font-ui text-sm text-zinc-500">
          This vehicle couldn't be found.
        </p>
        <button
          onClick={() => router.back()}
          className="font-ui rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-28 font-sans">
      <StyleBlock />

      <div className="relative">
        <ImageGallery vehicle={vehicle} title={title} />
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 rounded-full bg-white/90 p-2"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4.5 w-4.5 text-zinc-900" />
        </button>
      </div>

      <VehicleHeader vehicle={vehicle} title={title} />
      <SpecsRow vehicle={vehicle} />
      <PriceCountdownBar vehicle={vehicle} />
      <InfoTable vehicle={vehicle} />

      {vehicle.type === "auction" && <AuctionReportSection vehicle={vehicle} />}
      <OrderFlowSection />
      <RelatedVehiclesRow vehicle={vehicle} onOpen={handleOpenRelated} />

      {/* Sticky CTA — mobile equivalent of web's scroll-to-#order-form button */}
      <div
        className="fixed inset-x-0 bottom-15 z-20 mx-auto w-full max-w-sm border-t border-zinc-100 bg-white px-5 py-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => setOrderSheetOpen(true)}
          className="font-ui w-full rounded-xl  py-3.5 text-sm font-semibold text-white"
          style={{ background: themeColors.primary }}
        >
          {vehicle.type === "company" ? "Send Inquiry" : "Bid Request"}
        </button>
      </div>

      <OrderFormSheet
        vehicle={vehicle}
        open={orderSheetOpen}
        onClose={() => setOrderSheetOpen(false)}
      />
    </div>
  );
}
