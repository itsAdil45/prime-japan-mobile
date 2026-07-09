import { useState } from "react";
import { ChevronLeft, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

function isStrongPassword(pw) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
}

function PasswordField({ label, value, onChange, error }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="font-ui block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">
        {label}
      </span>
      <span
        className={`flex items-center gap-2 rounded-lg border px-3.5 py-3 ${
          error ? "border-red-300" : "border-zinc-200"
        }`}
      >
        <Lock className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className="w-full bg-transparent text-sm text-zinc-900 outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 text-zinc-400" />
          ) : (
            <Eye className="h-4 w-4 text-zinc-400" />
          )}
        </button>
      </span>
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

export default function ChangePasswordScreen({ onBack = () => {} }) {
  const [form, setForm] = useState({
    current_password: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.current_password)
      e.current_password = "Current password is required.";
    if (!form.password) e.password = "New password is required.";
    else if (!isStrongPassword(form.password))
      e.password =
        "Min 8 chars, one uppercase, one digit, one special character.";
    if (!form.confirm_password)
      e.confirm_password = "Please confirm your password.";
    else if (form.password !== form.confirm_password)
      e.confirm_password = "Passwords do not match.";
    return e;
  };

  const handleSubmit = () => {
    setSuccess(false);
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setForm({ current_password: "", password: "", confirm_password: "" });
    }, 900);
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
        <h1 className="font-display text-base font-semibold text-zinc-900">
          Change Password
        </h1>
      </div>

      <div className="mt-5 flex flex-col gap-4 px-5">
        {success && (
          <div className="font-ui flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Password changed successfully!
          </div>
        )}

        <PasswordField
          label="Current password"
          value={form.current_password}
          onChange={(e) => set("current_password", e.target.value)}
          error={errors.current_password}
        />
        <PasswordField
          label="New password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
        />
        <PasswordField
          label="Confirm password"
          value={form.confirm_password}
          onChange={(e) => set("confirm_password", e.target.value)}
          error={errors.confirm_password}
        />

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="font-ui mt-2 w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Processing…" : "Change password"}
        </button>
      </div>
    </div>
  );
}
