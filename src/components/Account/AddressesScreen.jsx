import { useState } from "react";
import {
  ChevronLeft,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  The web Addresses page uses a centered modal for add/edit/delete.  */
/*  On mobile all three become bottom sheets — one shared shell,        */
/*  different content — consistent with the filter sheet from Shop.     */
/* ------------------------------------------------------------------ */

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

const EMPTY_FORM = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  type: "shipping",
  is_default: false,
  notes: "",
};
const ADDRESS_TYPES = ["shipping", "billing"];

const MOCK_ADDRESSES = [
  {
    id: 1,
    street: "Sheikh Zayed Road, Tower 3",
    city: "Dubai",
    state: "Dubai",
    zip: "00000",
    country: "UAE",
    type: "shipping",
    is_default: true,
    notes: "Reception desk, ask for warehouse team",
  },
  {
    id: 2,
    street: "Mombasa Road 21",
    city: "Nairobi",
    state: "",
    zip: "",
    country: "Kenya",
    type: "billing",
    is_default: false,
    notes: "",
  },
];

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
            className="rounded-full bg-zinc-100 p-1.5"
            aria-label="Close"
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

function Field({ label, children }) {
  return (
    <label className="font-ui block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900";

function AddressForm({ form, onChange }) {
  const set = (patch) => onChange({ ...form, ...patch });
  return (
    <div className="flex flex-col gap-4">
      <Field label="Street address">
        <input
          className={inputClass}
          value={form.street}
          onChange={(e) => set({ street: e.target.value })}
          placeholder="Main St 10"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City">
          <input
            className={inputClass}
            value={form.city}
            onChange={(e) => set({ city: e.target.value })}
            placeholder="Dubai"
          />
        </Field>
        <Field label="State / emirate">
          <input
            className={inputClass}
            value={form.state}
            onChange={(e) => set({ state: e.target.value })}
            placeholder="Dubai"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="ZIP / postal code">
          <input
            className={inputClass}
            value={form.zip}
            onChange={(e) => set({ zip: e.target.value })}
            placeholder="00000"
          />
        </Field>
        <Field label="Country">
          <input
            className={inputClass}
            value={form.country}
            onChange={(e) => set({ country: e.target.value })}
            placeholder="UAE"
          />
        </Field>
      </div>
      <Field label="Address type">
        <div className="flex gap-2">
          {ADDRESS_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => set({ type: t })}
              className={`font-ui flex-1 rounded-lg py-2.5 text-xs font-semibold capitalize ${
                form.type === t
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Notes">
        <input
          className={inputClass}
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Near tower, ring twice…"
        />
      </Field>
      <label className="font-ui flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => set({ is_default: e.target.checked })}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Set as default address
      </label>
    </div>
  );
}

function AddressCard({ addr, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-ui text-sm font-medium text-zinc-900">
          {addr.street}
        </p>
        <div className="flex shrink-0 gap-1.5">
          <span
            className={`font-ui rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
              addr.type === "shipping"
                ? "bg-blue-50 text-blue-600"
                : "bg-purple-50 text-purple-600"
            }`}
          >
            {addr.type}
          </span>
          {addr.is_default && (
            <span className="font-ui flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              <Check className="h-2.5 w-2.5" /> default
            </span>
          )}
        </div>
      </div>
      <p className="font-ui mt-1.5 flex items-start gap-1 text-xs text-zinc-500">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
        {addr.city}
        {addr.state ? `, ${addr.state}` : ""} ·{" "}
        {addr.zip ? `${addr.zip} · ` : ""}
        {addr.country}
      </p>
      {addr.notes && (
        <p className="font-ui mt-2 border-t border-zinc-100 pt-2 text-xs italic text-zinc-400">
          {addr.notes}
        </p>
      )}
      <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
        <button
          onClick={() => onEdit(addr)}
          className="font-ui flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2 text-xs font-semibold text-zinc-700"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button
          onClick={() => onDelete(addr)}
          className="font-ui flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-600"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>
    </div>
  );
}

export default function AddressesScreen({ onBack = () => {} }) {
  const [addresses, setAddresses] = useState(MOCK_ADDRESSES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };
  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm(addr);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingId ? { ...form, id: editingId } : a)),
      );
    } else {
      setAddresses((prev) => [...prev, { ...form, id: Date.now() }]);
    }
    setSheetOpen(false);
  };

  const handleDelete = () => {
    setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

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
        <h1 className="font-display flex-1 text-base font-semibold text-zinc-900">
          Addresses
        </h1>
        <button
          onClick={openAdd}
          className="rounded-full bg-zinc-900 p-2.5"
          aria-label="Add address"
        >
          <Plus className="h-4 w-4 text-white" />
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 px-5">
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <MapPin className="h-8 w-8 text-zinc-300" />
            <p className="font-ui mt-3 text-sm text-zinc-400">
              No addresses saved yet.
            </p>
            <button
              onClick={openAdd}
              className="font-ui mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Add your first address
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              addr={addr}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Edit address" : "Add new address"}
        footer={
          <button
            onClick={handleSave}
            className="font-ui w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white"
          >
            {editingId ? "Update address" : "Add address"}
          </button>
        }
      >
        <AddressForm form={form} onChange={setForm} />
      </BottomSheet>

      <BottomSheet
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete address"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="font-ui flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="font-ui flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white"
            >
              Yes, delete
            </button>
          </div>
        }
      >
        <p className="font-ui text-sm text-zinc-500">
          Are you sure you want to delete this address? This action cannot be
          undone.
        </p>
      </BottomSheet>
    </div>
  );
}
