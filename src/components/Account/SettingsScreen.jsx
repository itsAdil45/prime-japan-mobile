import { useState } from "react";
import { ChevronLeft, ShieldCheck, Building2, User } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Settings.jsx's two-column form grid becomes a single column here;  */
/*  the company-fields section still toggles conditionally by          */
/*  accountType, same as web.                                          */
/* ------------------------------------------------------------------ */

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

const inputClass =
  "font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900";

function Field({ label, verified, children }) {
  return (
    <label className="font-ui block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
        {label}
        {verified && (
          <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">
            <ShieldCheck className="h-2.5 w-2.5" /> Verified
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export default function SettingsScreen({ onBack = () => {} }) {
  const [accountType] = useState("company"); // "individual" | "company"
  const [form, setForm] = useState({
    first_name: "Adil",
    last_name: "Shakeel",
    email: "adil@example.com",
    phone: "+971 50 000 0000",
    date_of_birth: "",
    company_name: "Prime Imports LLC",
    registration_number: "REG-4821",
    company_phone: "+971 4 000 0000",
    contact_first_name: "",
    contact_last_name: "",
    contact_email: "",
    contact_phone: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 900); // simulated save
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-28 font-sans">
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
          Settings
        </h1>
      </div>

      <div className="mt-4 px-5">
        <span
          className={`font-ui inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
            accountType === "company"
              ? "bg-blue-50 text-blue-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {accountType === "company" ? (
            <Building2 className="h-3.5 w-3.5" />
          ) : (
            <User className="h-3.5 w-3.5" />
          )}
          {accountType === "company" ? "Company account" : "Individual account"}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4 px-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input
              className={inputClass}
              value={form.first_name}
              onChange={(e) => set({ first_name: e.target.value })}
            />
          </Field>
          <Field label="Last name">
            <input
              className={inputClass}
              value={form.last_name}
              onChange={(e) => set({ last_name: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Date of birth (optional)">
          <input
            type="date"
            className={inputClass}
            value={form.date_of_birth}
            onChange={(e) => set({ date_of_birth: e.target.value })}
          />
        </Field>

        <Field label="Phone number">
          <input
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="+971 50 000 0000"
          />
        </Field>

        <Field label="Email address" verified>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </Field>

        {accountType === "company" && (
          <>
            <div className="relative my-1 text-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
              <span className="font-ui relative bg-zinc-50 px-3 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Company information
              </span>
            </div>

            <Field label="Company name">
              <input
                className={inputClass}
                value={form.company_name}
                onChange={(e) => set({ company_name: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Registration number">
                <input
                  className={inputClass}
                  value={form.registration_number}
                  onChange={(e) => set({ registration_number: e.target.value })}
                />
              </Field>
              <Field label="Company phone">
                <input
                  type="tel"
                  className={inputClass}
                  value={form.company_phone}
                  onChange={(e) => set({ company_phone: e.target.value })}
                />
              </Field>
            </div>

            <div className="relative my-1 text-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
              <span className="font-ui relative bg-zinc-50 px-3 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Contact person
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact first name">
                <input
                  className={inputClass}
                  value={form.contact_first_name}
                  onChange={(e) => set({ contact_first_name: e.target.value })}
                />
              </Field>
              <Field label="Contact last name">
                <input
                  className={inputClass}
                  value={form.contact_last_name}
                  onChange={(e) => set({ contact_last_name: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.contact_email}
                  onChange={(e) => set({ contact_email: e.target.value })}
                />
              </Field>
              <Field label="Contact phone">
                <input
                  type="tel"
                  className={inputClass}
                  value={form.contact_phone}
                  onChange={(e) => set({ contact_phone: e.target.value })}
                />
              </Field>
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-20 mx-auto max-w-sm px-5 pb-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-ui w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
