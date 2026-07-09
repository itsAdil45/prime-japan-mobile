import { useState } from "react";
import { ChevronLeft, X, MapPin, Calendar } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  BidsContent's <table> doesn't fit a phone screen, so each row      */
/*  becomes a compact card. Tapping a card opens the same detail info  */
/*  (BidDetailModal on web) as a bottom sheet instead of a centered     */
/*  modal, consistent with the filter sheet pattern from the shop.      */
/* ------------------------------------------------------------------ */

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

const STATUS_TONE = {
  submitted: "bg-blue-50 text-blue-600",
  pending: "bg-amber-50 text-amber-600",
  won: "bg-emerald-50 text-emerald-600",
  lost: "bg-red-50 text-red-600",
  cancelled: "bg-zinc-100 text-zinc-500",
};

const MOCK_BIDS = [
  {
    id: 1,
    bid_number: "BID-1042",
    make: "Toyota",
    model: "Land Cruiser",
    year: 2021,
    price_usd: 22800,
    destination_city_port: "Dubai",
    destination_country: "UAE",
    status: "won",
    status_label: "Won",
    created_at: "2026-06-18",
  },
  {
    id: 2,
    bid_number: "BID-1039",
    make: "Honda",
    model: "CR-V",
    year: 2020,
    price_usd: 14300,
    destination_city_port: "Mombasa",
    destination_country: "Kenya",
    status: "pending",
    status_label: "Pending",
    created_at: "2026-06-22",
  },
  {
    id: 3,
    bid_number: "BID-1035",
    make: "Nissan",
    model: "X-Trail",
    year: 2019,
    price_usd: 12750,
    destination_city_port: null,
    destination_country: "Tanzania",
    status: "lost",
    status_label: "Lost",
    created_at: "2026-06-10",
  },
  {
    id: 4,
    bid_number: "BID-1031",
    make: "Mazda",
    model: "CX-5",
    year: 2022,
    price_usd: 17900,
    destination_city_port: "Karachi",
    destination_country: "Pakistan",
    status: "submitted",
    status_label: "Submitted",
    created_at: "2026-06-28",
  },
];

const FILTERS = ["all", "pending", "won", "lost"];

function StatusBadge({ status, label }) {
  const tone = STATUS_TONE[status] ?? "bg-zinc-100 text-zinc-500";
  return (
    <span
      className={`font-ui rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${tone}`}
    >
      {label}
    </span>
  );
}

function BidCard({ bid, onOpen }) {
  return (
    <button
      onClick={() => onOpen(bid)}
      className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-ui text-[11px] text-zinc-400">{bid.bid_number}</p>
          <p className="font-display mt-0.5 text-sm font-semibold text-zinc-900">
            {bid.year} {bid.make} {bid.model}
          </p>
        </div>
        <StatusBadge status={bid.status} label={bid.status_label} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-ui flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3" />
          {bid.destination_city_port ? `${bid.destination_city_port}, ` : ""}
          {bid.destination_country}
        </span>
        <span className="font-display tabular-nums text-sm font-semibold text-zinc-900">
          ${bid.price_usd.toLocaleString()}
        </span>
      </div>
    </button>
  );
}

function BidDetailSheet({ bid, onClose }) {
  if (!bid) return null;
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
            {bid.bid_number}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full bg-zinc-100 p-1.5"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        <div className="mt-4 space-y-3 font-ui text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Vehicle</span>
            <span className="font-medium text-zinc-900">
              {bid.year} {bid.make} {bid.model}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Bid price</span>
            <span className="font-medium text-zinc-900">
              ${bid.price_usd.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Destination</span>
            <span className="font-medium text-zinc-900">
              {bid.destination_city_port
                ? `${bid.destination_city_port}, `
                : ""}
              {bid.destination_country}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Status</span>
            <StatusBadge status={bid.status} label={bid.status_label} />
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Submitted</span>
            <span className="flex items-center gap-1 font-medium text-zinc-900">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(bid.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BidSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
      <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
    </div>
  );
}

export default function BidsScreen({ onBack = () => {} }) {
  const [mounted, setMounted] = useState(true); // set false initially if wiring real loading
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = MOCK_BIDS.filter(
    (b) => filter === "all" || b.status === filter,
  );

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 font-sans">
      <StyleBlock />

      <div className="flex items-center gap-3 px-5 pt-6">
        <button
          onClick={onBack}
          className="rounded-full bg-zinc-100 p-2"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4.5 w-4.5 text-zinc-700" />
        </button>
        <h1 className="font-display text-base font-semibold text-zinc-900">
          Bid Requests
        </h1>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-ui shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${
              filter === f
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 px-5">
        {!mounted ? (
          Array.from({ length: 3 }).map((_, i) => <BidSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <p className="font-ui py-16 text-center text-sm text-zinc-400">
            No bid requests found.
          </p>
        ) : (
          filtered.map((bid) => (
            <BidCard key={bid.id} bid={bid} onOpen={setSelected} />
          ))
        )}
      </div>

      <BidDetailSheet bid={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
