import { useState } from "react";
import { ChevronLeft, Calendar } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  InvoicesContent's table → stacked cards. Type + status badges kept  */
/*  the same meaning as web, just laid out for a narrow screen.         */
/* ------------------------------------------------------------------ */

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

const STATUS_TONE = {
  pending: "bg-zinc-100 text-zinc-500",
  under_review: "bg-blue-50 text-blue-600",
  confirmed: "bg-emerald-50 text-emerald-600",
  overdue: "bg-red-50 text-red-600",
  cancelled: "bg-zinc-100 text-zinc-400",
};

const TYPE_TONE = {
  advance: "bg-amber-50 text-amber-600",
  remaining: "bg-blue-50 text-blue-600",
};

const MOCK_INVOICES = [
  {
    id: 1,
    invoice_number: "INV-3081",
    invoice_type: "advance",
    invoice_type_label: "Advance",
    percent: 30,
    amount_jpy: 620000,
    amount_usd: 4200,
    due_date: "2026-07-20",
    status: "pending",
    status_label: "Pending",
    created_at: "2026-07-01",
  },
  {
    id: 2,
    invoice_number: "INV-3076",
    invoice_type: "remaining",
    invoice_type_label: "Remaining",
    percent: 70,
    amount_jpy: 1450000,
    amount_usd: 9800,
    due_date: "2026-06-15",
    status: "overdue",
    status_label: "Overdue",
    created_at: "2026-05-28",
  },
  {
    id: 3,
    invoice_number: "INV-3060",
    invoice_type: "advance",
    invoice_type_label: "Advance",
    percent: 30,
    amount_jpy: 390000,
    amount_usd: 2650,
    due_date: "2026-06-01",
    status: "confirmed",
    status_label: "Confirmed",
    created_at: "2026-05-10",
  },
];

function Badge({ tone, children }) {
  return (
    <span
      className={`font-ui rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${tone}`}
    >
      {children}
    </span>
  );
}

function InvoiceCard({ inv }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-ui text-[11px] text-zinc-400">
            {inv.invoice_number}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge
              tone={TYPE_TONE[inv.invoice_type] ?? "bg-zinc-100 text-zinc-500"}
            >
              {inv.invoice_type_label}
            </Badge>
            <span className="font-ui text-[11px] text-zinc-400">
              {inv.percent}%
            </span>
          </div>
        </div>
        <Badge tone={STATUS_TONE[inv.status] ?? "bg-zinc-100 text-zinc-500"}>
          {inv.status_label}
        </Badge>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="font-display tabular-nums text-sm font-semibold text-zinc-900">
            ¥{inv.amount_jpy.toLocaleString()}
          </p>
          <p className="font-ui tabular-nums text-xs text-zinc-400">
            ${inv.amount_usd.toLocaleString()}
          </p>
        </div>
        <span className="font-ui flex items-center gap-1 text-xs text-zinc-500">
          <Calendar className="h-3 w-3" />
          Due{" "}
          {new Date(inv.due_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
      <div className="mt-2 h-4 w-1/4 animate-pulse rounded bg-zinc-100" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
    </div>
  );
}

export default function InvoicesScreen({ onBack = () => {} }) {
  const [mounted] = useState(true);

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
          Invoices
        </h1>
      </div>

      <div className="mt-5 flex flex-col gap-3 px-5">
        {!mounted ? (
          Array.from({ length: 3 }).map((_, i) => <InvoiceSkeleton key={i} />)
        ) : MOCK_INVOICES.length === 0 ? (
          <p className="font-ui py-16 text-center text-sm text-zinc-400">
            No invoices found.
          </p>
        ) : (
          MOCK_INVOICES.map((inv) => <InvoiceCard key={inv.id} inv={inv} />)
        )}
      </div>
    </div>
  );
}
