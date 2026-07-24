"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, CheckCircle2 } from "lucide-react";
import useGet from "@/customHooks/useGet";
import usePost from "@/customHooks/usePost";

/* ------------------------------------------------------------------ */
/*  Mirrors OrderForm.jsx (vehicle.type !== "company") and              */
/*  InquiryOrderForm.jsx (vehicle.type === "company") from web,          */
/*  combined into one full-screen sheet since most of the destination/   */
/*  port fetching logic is identical between the two.                    */
/*                                                                        */
/*  Real endpoints used, same as web:                                    */
/*    GET  /freight/destinations                                         */
/*    GET  /freight/destinations/{country}                               */
/*    POST /freight/preview        (auction/order flow only, debounced)  */
/*    POST /bid-requests           (auction/order flow submit)           */
/*    POST /inquiries              (company/inquiry flow submit)         */
/*                                                                        */
/*  ASSUMPTIONS:                                                         */
/*  1. Currency defaults to USD throughout — no CurrencyContext ported   */
/*     to mobile yet. JPY_USD_RATE is copied verbatim from web's          */
/*     OrderForm.jsx; that hardcoded rate looks like a placeholder on     */
/*     web too, not something I introduced — flagging in case it needs   */
/*     to become a real live rate at some point.                        */
/*  2. postData's third argument (requireAuth) is passed true per web's   */
/*     usage in both forms.                                              */
/* ------------------------------------------------------------------ */

const JPY_USD_RATE = 0.0067; // copied verbatim from web's OrderForm.jsx

function fmt(amount) {
  return amount == null ? "—" : `$${Number(amount).toLocaleString()}`;
}

function FieldLabel({ children }) {
  return (
    <label className="font-ui mb-1.5 block text-xs font-medium text-zinc-600">
      {children}
    </label>
  );
}

const selectClass =
  "font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 disabled:opacity-50";

function RadioPair({ value, onChange, options = ["yes", "no"] }) {
  return (
    <div className="flex gap-2">
      {options.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`font-ui flex-1 rounded-lg py-2.5 text-xs font-semibold capitalize ${
            value === v ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function OrderFormSheet({ vehicle, open, onClose }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isCompany = vehicle?.type === "company";

  const [form, setForm] = useState({
    country: "",
    port: "",
    shippingMode: "",
    inspection: "no",
    insurance: "no",
    message: "",
  });
  const [bidAmount, setBidAmount] = useState(Number(vehicle?.price_usd) || 0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const debounceRef = useRef(null);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const { data: countriesData, loading: countriesLoading } = useGet(
    "/freight/destinations",
    true,
    false,
  );
  const countries = countriesData?.data ?? [];

  const { data: portsData, loading: portsLoading } = useGet(
    form.country ? `/freight/destinations/${form.country}` : null,
    !!form.country,
    false,
  );
  const ports = portsData?.data ?? [];

  useEffect(() => {
    set({ port: "", shippingMode: "" });
  }, [form.country]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- /freight/preview integration (auction/order flow only) ---- */
  const { postData: postPreview, loading: previewLoading } = usePost();
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  const fetchPreview = async () => {
    if (!form.country || !form.port) return;
    setPreviewError(null);
    const bidPriceJpy = Math.round(Number(bidAmount) / JPY_USD_RATE);

    const payload = {
      bid_price_jpy: bidPriceJpy,
      destination_country: form.country,
      destination_city_port: form.port,
      vehicle_category: "normal",
      shipment: form.shippingMode || "container",
      auction_house: vehicle?.auction_house ?? "",
      vehicle_snapshot: vehicle,
      inspection_required: form.inspection === "yes",
      customer_user_id: session?.user?.customer_id ?? "",
    };

    const result = await postPreview("/freight/preview", payload, false);
    const data = result?.data ?? result;

    if (data) {
      setPreviewData(data);
      set({
        shippingMode:
          form.shippingMode || data.shipping_options?.[0]?.mode || "",
      });
    } else {
      setPreviewError("Unable to fetch shipping estimate.");
    }
  };

  useEffect(() => {
    if (isCompany) return; // preview flow is auction/order only
    if (!form.country || !form.port) {
      setPreviewData(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPreview, 500);
    return () => clearTimeout(debounceRef.current);
  }, [form.country, form.port, bidAmount, form.inspection, isCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedOption =
    previewData?.shipping_options?.find((o) => o.mode === form.shippingMode) ||
    previewData?.shipping_options?.[0] ||
    null;

  const pick = (obj, keyBase) => obj?.[`${keyBase}_usd`] ?? null;

  /* ---- submit ---- */
  const { postData, loading: submitting, error: submitError } = usePost();

  const handleSubmit = async () => {
    if (!session?.user) return;

    if (isCompany) {
      const payload = {
        vehicle_id: vehicle?.id,
        customer_message: form.message,
        destination_country: form.country,
        destination_city_port: form.port,
        inspection_required: form.inspection === "yes",
        insurance_required: form.insurance === "yes",
      };
      const result = await postData("/inquiries", payload, true);
      if (result) setSubmitSuccess(true);
      return;
    }

    const vehicleUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auction/${vehicle?.id}`
        : "";
    const payload = {
      vehicle_url: vehicleUrl,
      destination_country: form.country,
      destination_city_port: form.port,
      inspection_required: form.inspection === "yes",
      insurance_required: form.insurance === "yes",
      bid_amount_jpy: Math.round(Number(bidAmount) / JPY_USD_RATE),
      bid_amount_usd: Math.round(Number(bidAmount)),
      shipping_mode: form.shippingMode,
      notes: form.message,
      vehicle_snapshot_json: vehicle,
    };
    const result = await postData("/bid-requests", payload, true);
    if (result) setSubmitSuccess(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white font-sans">
      <div
        className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <h2 className="font-display text-base font-semibold text-zinc-900">
          {isCompany ? "Send Inquiry" : "Order Vehicle"}
        </h2>
        <button
          onClick={onClose}
          className="rounded-full bg-zinc-100 p-1.5"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-zinc-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {submitSuccess ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="font-display text-base font-semibold text-zinc-900">
              {isCompany ? "Inquiry submitted!" : "Bid request submitted!"}
            </p>
            <p className="font-ui text-sm text-zinc-500">
              We'll get back to you shortly.
            </p>
            <button
              onClick={onClose}
              className="font-ui mt-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : !session?.user ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-ui text-sm text-zinc-500">
              Log in to {isCompany ? "send an inquiry" : "place a bid"}.
            </p>
            <button
              onClick={() =>
                router.push(
                  `/login?redirect=${encodeURIComponent(
                    `/${vehicle.type}/${vehicle.id}`,
                  )}`,
                )
              }
              className="font-ui rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Log in
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {submitError && (
              <p className="font-ui rounded-lg bg-red-50 px-3.5 py-2.5 text-xs text-red-600">
                {submitError}
              </p>
            )}

            <h3 className="font-ui text-sm font-semibold text-zinc-900">
              Destination
            </h3>

            <div>
              <FieldLabel>Country</FieldLabel>
              <select
                value={form.country}
                onChange={(e) => set({ country: e.target.value })}
                disabled={countriesLoading}
                className={selectClass}
              >
                <option value="">
                  {countriesLoading ? "Loading countries…" : "Select country"}
                </option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Port</FieldLabel>
              <select
                value={form.port}
                onChange={(e) => set({ port: e.target.value })}
                disabled={!form.country || portsLoading}
                className={selectClass}
              >
                <option value="">
                  {portsLoading
                    ? "Loading ports…"
                    : !form.country
                    ? "Select a country first"
                    : "Select port"}
                </option>
                {ports.map((p) => (
                  <option
                    key={p.destination_city_port}
                    value={p.destination_city_port}
                  >
                    {p.destination_city_port}
                    {p.charges?.length <= 0 ? " (Not available)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Shipping mode — auction/order flow only, populated from /freight/preview */}
            {!isCompany && form.port && (
              <div>
                <FieldLabel>Shipping mode</FieldLabel>
                {previewLoading && !previewData ? (
                  <p className="font-ui text-xs text-zinc-400">
                    Calculating shipping options…
                  </p>
                ) : !previewData?.shipping_options?.length ? (
                  <p className="font-ui text-xs text-zinc-400">
                    No shipping options available for this port.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {previewData.shipping_options.map((o) => (
                      <button
                        key={o.mode}
                        type="button"
                        onClick={() => set({ shippingMode: o.mode })}
                        className={`font-ui flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs ${
                          form.shippingMode === o.mode
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-zinc-200"
                        }`}
                      >
                        <span className="font-semibold text-zinc-900">
                          {o.label}
                        </span>
                        <span className="text-zinc-500">
                          {fmt(pick(o, "freight"))}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <FieldLabel>Inspection required</FieldLabel>
              <RadioPair
                value={form.inspection}
                onChange={(v) => set({ inspection: v })}
              />
            </div>

            <div>
              <FieldLabel>Insurance required</FieldLabel>
              <RadioPair
                value={form.insurance}
                onChange={(v) => set({ insurance: v })}
              />
            </div>

            {/* Bid amount slider — auction/order flow only */}
            {!isCompany && (
              <div>
                <FieldLabel>Bidding amount</FieldLabel>
                <input
                  type="range"
                  min={Number(vehicle?.price_usd) || 0}
                  max={
                    Number(vehicle?.avg_price_usd) ||
                    (Number(vehicle?.price_usd) || 0) + 5000
                  }
                  step={1}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="w-full accent-zinc-900"
                />
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-ui text-xs text-zinc-400">
                    {fmt(vehicle?.price_usd)}
                  </span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value) || 0)}
                    className="font-ui w-28 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-center text-sm font-semibold text-zinc-900"
                  />
                  <span className="font-ui text-xs text-zinc-400">
                    {fmt(vehicle?.avg_price_usd)}
                  </span>
                </div>
              </div>
            )}

            {/* Total breakdown — auction/order flow only */}
            {!isCompany && (
              <div className="rounded-xl bg-zinc-50 px-3.5 py-3">
                <p className="font-ui text-xs font-semibold text-zinc-700">
                  Total price
                </p>
                {previewLoading && !previewData && (
                  <p className="font-ui mt-1 text-xs text-zinc-400">
                    Calculating total…
                  </p>
                )}
                {previewError && (
                  <p className="font-ui mt-1 text-xs text-red-600">
                    {previewError}
                  </p>
                )}
                {previewData && selectedOption ? (
                  <div className="mt-2 space-y-1 font-ui text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Bid price</span>
                      <span>{fmt(bidAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Agent fee</span>
                      <span>{fmt(pick(previewData, "auction_fee"))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Inspection</span>
                      <span>{fmt(pick(previewData, "inspection"))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Domestic transport</span>
                      <span>
                        {fmt(pick(previewData, "domestic_transport"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tax</span>
                      <span>{fmt(pick(previewData, "tax"))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">
                        Freight ({selectedOption.label})
                      </span>
                      <span>{fmt(pick(selectedOption, "freight"))}</span>
                    </div>
                    <div className="mt-1.5 flex justify-between border-t border-zinc-200 pt-1.5 font-semibold text-zinc-900">
                      <span>Total (USD)</span>
                      <span>{fmt(pick(selectedOption, "grand_total"))}</span>
                    </div>
                  </div>
                ) : (
                  !previewLoading && (
                    <p className="font-ui mt-1 text-xs text-zinc-400">
                      Select a country and port to see the total.
                    </p>
                  )
                )}
              </div>
            )}

            <div>
              <FieldLabel>Message</FieldLabel>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => set({ message: e.target.value })}
                placeholder="Any additional notes…"
                className="font-ui w-full resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900"
              />
            </div>
          </div>
        )}
      </div>

      {session?.user && !submitSuccess && (
        <div
          className="border-t border-zinc-100 px-5 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={handleSubmit}
            disabled={
              submitting || (!isCompany && (!form.shippingMode || !previewData))
            }
            className="font-ui w-full rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting
              ? "Submitting…"
              : isCompany
              ? "Send Inquiry"
              : "Send Bid Request"}
          </button>
        </div>
      )}
    </div>
  );
}
