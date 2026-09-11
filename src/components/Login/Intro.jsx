"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import usePost from "@/customHooks/usePost";
import { isValidEmail, isStrongPassword } from "@/utils/validators/FormValidator";
import {
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";

const FontImports = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Fraunces', serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

function Masthead({ mode }) {
  return (
    <div className="flex flex-col items-center pt-10 pb-8">
      <span className="font-display text-2xl tracking-tight text-slate-900">
        Prime Japan
      </span>

      <p className="font-ui mt-5 text-sm text-slate-500">
        {mode === "login"
          ? "Sign in to keep exploring Cars"
          : "Create an account to save your search"}
      </p>
    </div>
  );
}

function ModeSwitch({ mode, onChange }) {
  return (
    <div className="font-ui relative grid grid-cols-2 rounded-full bg-slate-100 p-1">
      <div
        className={`absolute inset-y-1 w-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          mode === "signup" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {["login", "signup"].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`relative z-10 rounded-full py-2.5 text-sm font-medium transition-colors ${
            mode === m ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {m === "login" ? "Log in" : "Sign up"}
        </button>
      ))}
    </div>
  );
}

function Field({ icon: Icon, label, error, ...props }) {
  return (
    <label className="font-ui block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <span
        className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 py-3 focus-within:ring-1 ${
          error
            ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-400"
            : "border-slate-200 focus-within:border-slate-900 focus-within:ring-slate-900"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-350 outline-none"
          {...props}
        />
      </span>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </label>
  );
}

function PasswordField({ label = "Password", error, hint, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="font-ui block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <span
        className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 py-3 focus-within:ring-1 ${
          error
            ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-400"
            : "border-slate-200 focus-within:border-slate-900 focus-within:ring-slate-900"
        }`}
      >
        <Lock className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type={visible ? "text" : "password"}
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-350 outline-none"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 text-slate-400" />
          ) : (
            <Eye className="h-4 w-4 text-slate-400" />
          )}
        </button>
      </span>
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </label>
  );
}

function AccountTypeToggle({ value, onChange }) {
  return (
    <div className="font-ui relative grid grid-cols-2 rounded-full bg-slate-100 p-1">
      <div
        className={`absolute inset-y-1 w-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          value === "company" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <button
        type="button"
        onClick={() => onChange("individual")}
        className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-medium transition-colors ${
          value === "individual" ? "text-slate-900" : "text-slate-400"
        }`}
      >
        <User className="h-3.5 w-3.5" />
        Individual
      </button>
      <button
        type="button"
        onClick={() => onChange("company")}
        className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-medium transition-colors ${
          value === "company" ? "text-slate-900" : "text-slate-400"
        }`}
      >
        <Building2 className="h-3.5 w-3.5" />
        Company
      </button>
    </div>
  );
}

/* ---------- Buttons ---------- */

function PrimaryButton({ children, loading, ...props }) {
  return (
    <button
      className="font-ui flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
      disabled={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {children}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

function GoogleButton({ children }) {
  return (
    <button className="font-ui flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-medium text-slate-700 transition active:scale-[0.98]">
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.09Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
        />
      </svg>
      {children}
    </button>
  );
}

/* ---------- Divider ---------- */

function Divider() {
  return (
    <div className="font-ui flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs text-slate-400">or continue with</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

/* ---------- Forms ---------- */

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        remember_me: String(rememberMe),
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/home");
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Field
        icon={Mail}
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <div>
        <PasswordField
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <div className="mt-2 flex items-center justify-between">
          <label className="font-ui flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <button
            type="button"
            className="font-ui text-xs font-medium text-slate-500 underline underline-offset-2"
          >
            Forgot password?
          </button>
        </div>
      </div>

      {error && (
        <p className="font-ui text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      <PrimaryButton type="submit" loading={loading}>
        Log in
      </PrimaryButton>
    </form>
  );
}

function SignupForm() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { postData, error: postError } = usePost();

  const [accountType, setAccountType] = useState("individual");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeTerms: false,
    companyName: "",
    regNumber: "",
    companyAddress: "",
    companyPhone: "",
    contactFname: "",
    contactLname: "",
    contactEmail: "",
    contactPhone: "",
    contactPassword: "",
    companyAgreeTerms: false,
  });

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validateIndividual = () => {
    const e = {};
    if (!form.fname.trim()) e.fname = "First name is required.";
    if (!form.lname.trim()) e.lname = "Last name is required.";
    if (!form.email) e.email = "Email is required.";
    else if (!isValidEmail(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (!isStrongPassword(form.password))
      e.password =
        "Min 8 chars, one uppercase, one digit, one special character.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (!form.agreeTerms) e.agreeTerms = "You must agree to the terms.";
    return e;
  };

  const validateCompany = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required.";
    if (!form.companyAddress.trim())
      e.companyAddress = "Company address is required.";
    if (!form.companyPhone.trim()) e.companyPhone = "Phone is required.";
    if (!form.contactFname.trim()) e.contactFname = "First name is required.";
    if (!form.contactLname.trim()) e.contactLname = "Last name is required.";
    if (!form.contactEmail) e.contactEmail = "Email is required.";
    else if (!isValidEmail(form.contactEmail))
      e.contactEmail = "Enter a valid email.";
    if (!form.contactPhone.trim())
      e.contactPhone = "Contact phone is required.";
    if (!form.contactPassword) e.contactPassword = "Password is required.";
    else if (!isStrongPassword(form.contactPassword))
      e.contactPassword =
        "Min 8 chars, one uppercase, one digit, one special character.";
    if (!form.companyAgreeTerms)
      e.companyAgreeTerms = "You must agree to the terms.";
    return e;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    const errs =
      accountType === "individual" ? validateIndividual() : validateCompany();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      if (!executeRecaptcha) {
        toast.error("reCAPTCHA not ready yet. Please try again in a moment.");
        setLoading(false);
        return;
      }
      const recaptcha_token = await executeRecaptcha("register");

      const payload =
        accountType === "individual"
          ? {
              account_type: "individual",
              first_name: form.fname,
              last_name: form.lname,
              email: form.email,
              password: form.password,
              password_confirmation: form.confirmPassword,
              phone: form.phone,
              terms_accepted: form.agreeTerms,
              platform: "mobile",
              recaptcha_token,
            }
          : {
              account_type: "company",
              first_name: form.contactFname,
              last_name: form.contactLname,
              email: form.contactEmail,
              password: form.contactPassword,
              password_confirmation: form.contactPassword,
              phone: form.contactPhone,
              terms_accepted: form.companyAgreeTerms,
              company_name: form.companyName,
              registration_number: form.regNumber || undefined,
              company_phone: form.companyPhone,
              company_address: form.companyAddress,
              contact_first_name: form.contactFname,
              contact_last_name: form.contactLname,
              contact_email: form.contactEmail,
              contact_phone: form.contactPhone,
              platform: "mobile",
              recaptcha_token,
            };

      const result = await postData("/register", payload, false);

      if (result?.status == true) {
        toast.success("Account created successfully!");

        const registrationToken = result?.data?.token;
        const registrationEmail =
          accountType === "individual" ? form.email : form.contactEmail;

        if (registrationToken) {
          Cookies.set("reg_token", registrationToken);
        }
        sessionStorage.setItem("reg_email", registrationEmail);

        router.push("/verify-email");
      } else {
        toast.error(
          postError || "Failed to create account. Please try again.",
        );
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <AccountTypeToggle value={accountType} onChange={setAccountType} />

      {accountType === "individual" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={User}
              label="First name"
              type="text"
              placeholder="Jane"
              value={form.fname}
              error={errors.fname}
              onChange={(e) => set("fname", e.target.value)}
            />
            <Field
              icon={User}
              label="Last name"
              type="text"
              placeholder="Doe"
              value={form.lname}
              error={errors.lname}
              onChange={(e) => set("lname", e.target.value)}
            />
          </div>
          <Field
            icon={Mail}
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            error={errors.email}
            onChange={(e) => set("email", e.target.value)}
          />
          <Field
            icon={Mail}
            label="Phone number"
            type="tel"
            placeholder="+92 300 1234567"
            value={form.phone}
            error={errors.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <PasswordField
            placeholder="At least 8 characters"
            value={form.password}
            error={errors.password}
            hint="Min 8 chars, one uppercase, one digit, one special character."
            onChange={(e) => set("password", e.target.value)}
          />
          <PasswordField
            label="Confirm password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
          />
          <label className="font-ui flex items-start gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
              checked={form.agreeTerms}
              onChange={(e) => set("agreeTerms", e.target.checked)}
            />
            <span>
              I agree to the{" "}
              <span className="font-medium text-slate-700 underline underline-offset-2">
                Terms
              </span>{" "}
              and{" "}
              <span className="font-medium text-slate-700 underline underline-offset-2">
                Privacy Policy
              </span>
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-xs text-red-500">{errors.agreeTerms}</p>
          )}
        </>
      ) : (
        <>
          <p className="font-ui text-xs font-semibold uppercase tracking-wide text-slate-500">
            Company information
          </p>
          <Field
            icon={Building2}
            label="Company name"
            type="text"
            placeholder="Acme Traders"
            value={form.companyName}
            error={errors.companyName}
            onChange={(e) => set("companyName", e.target.value)}
          />
          <Field
            icon={Building2}
            label="Registration number"
            type="text"
            placeholder="Optional"
            value={form.regNumber}
            onChange={(e) => set("regNumber", e.target.value)}
          />
          <Field
            icon={Building2}
            label="Company address"
            type="text"
            placeholder="Street, city"
            value={form.companyAddress}
            error={errors.companyAddress}
            onChange={(e) => set("companyAddress", e.target.value)}
          />
          <Field
            icon={Building2}
            label="Company phone"
            type="tel"
            placeholder="+92 21 1234567"
            value={form.companyPhone}
            error={errors.companyPhone}
            onChange={(e) => set("companyPhone", e.target.value)}
          />

          <p className="font-ui mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contact person
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={User}
              label="First name"
              type="text"
              placeholder="Jane"
              value={form.contactFname}
              error={errors.contactFname}
              onChange={(e) => set("contactFname", e.target.value)}
            />
            <Field
              icon={User}
              label="Last name"
              type="text"
              placeholder="Doe"
              value={form.contactLname}
              error={errors.contactLname}
              onChange={(e) => set("contactLname", e.target.value)}
            />
          </div>
          <Field
            icon={Mail}
            label="Contact email"
            type="email"
            placeholder="you@example.com"
            value={form.contactEmail}
            error={errors.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
          />
          <Field
            icon={Mail}
            label="Contact phone"
            type="tel"
            placeholder="+92 300 1234567"
            value={form.contactPhone}
            error={errors.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
          />
          <PasswordField
            placeholder="At least 8 characters"
            value={form.contactPassword}
            error={errors.contactPassword}
            hint="Min 8 chars, one uppercase, one digit, one special character."
            onChange={(e) => set("contactPassword", e.target.value)}
          />
          <label className="font-ui flex items-start gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
              checked={form.companyAgreeTerms}
              onChange={(e) => set("companyAgreeTerms", e.target.checked)}
            />
            <span>
              I agree to the{" "}
              <span className="font-medium text-slate-700 underline underline-offset-2">
                Terms
              </span>{" "}
              and{" "}
              <span className="font-medium text-slate-700 underline underline-offset-2">
                Privacy Policy
              </span>
            </span>
          </label>
          {errors.companyAgreeTerms && (
            <p className="text-xs text-red-500">{errors.companyAgreeTerms}</p>
          )}
        </>
      )}

      <PrimaryButton type="submit" loading={loading}>
        Create account
      </PrimaryButton>
    </form>
  );
}

/* ---------- Root ---------- */

export default function Login() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      scriptProps={{ async: true, defer: true, appendTo: "head" }}
    >
      <LoginInner />
    </GoogleReCaptchaProvider>
  );
}

function LoginInner() {
  const [mode, setMode] = useState("login");

  return (
    <div className="flex flex-1 items-start justify-center bg-zinc-50 font-sans dark:bg-white">
      <FontImports />
      <div
        className="w-full max-w-sm px-6 pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
      >
        <Masthead mode={mode} />

        <ModeSwitch mode={mode} onChange={setMode} />

        <div className="mt-7">
          {mode === "login" ? <LoginForm /> : <SignupForm />}
        </div>

        <div className="mt-6">
          <Divider />
        </div>

        <div className="mt-4">
          <GoogleButton>Continue with Google</GoogleButton>
        </div>

        <p className="font-ui mt-7 text-center text-xs text-slate-500">
          {mode === "login"
            ? "New to Prime Japan?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
