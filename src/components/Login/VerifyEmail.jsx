"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "@/libs/axios";
import { Mail, Loader2 } from "lucide-react";

const CODE_LENGTH = 6;

export default function VerifyEmail() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    const storedToken = Cookies.get("reg_token");
    const storedEmail = sessionStorage.getItem("reg_email");
    if (storedToken) setToken(storedToken);
    if (storedEmail) setEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const setDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return; // only single digits
    setError("");
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    pasted
      .slice(0, CODE_LENGTH)
      .split("")
      .forEach((d, i) => (next[i] = d));
    setDigits(next);
    const lastFilled = Math.min(pasted.length, CODE_LENGTH) - 1;
    inputRefs.current[Math.max(lastFilled, 0)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");

    if (code.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code.`);
      return;
    }
    if (!token) {
      toast.error("Session expired. Please sign up again.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        "/email/otp/verify",
        { code },
        { headers: authHeaders },
      );

      if (response.data?.status !== false) {
        toast.success("Email verified! You can now sign in.");
        Cookies.remove("reg_token");
        sessionStorage.removeItem("reg_email");
        // NOTE: if the API starts returning a session/login token here,
        // sign the user in directly and router.push("/home") instead.
        router.push("/login");
      } else {
        setError(response.data?.message || "Invalid or expired code.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid or expired code. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!token) {
      toast.error("Session expired. Please sign up again.");
      return;
    }
    setResendLoading(true);
    try {
      await axios.post("/email/resend", {}, { headers: authHeaders });
      toast.success("Verification code resent! Check your inbox.");
      setResendCooldown(60);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to resend verification code.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-start justify-center bg-zinc-50 font-sans dark:bg-white">
      <div
        className="w-full max-w-sm px-6 pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col items-center pt-10 pb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="font-display mt-5 text-2xl tracking-tight text-slate-900">
            Verify your email
          </h1>
          <p className="font-ui mt-3 text-center text-sm text-slate-500">
            We sent a {CODE_LENGTH}-digit code to
            {email ? (
              <span className="font-medium text-slate-700"> {email}</span>
            ) : (
              " your email"
            )}
            . Enter it below to activate your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`font-ui h-12 w-11 rounded-xl border text-center text-lg font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 ${
                  error ? "border-red-400" : "border-slate-200"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="font-ui text-center text-xs text-red-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="font-ui flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Verify email"
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            className="font-ui text-xs font-medium text-slate-500 underline underline-offset-2 disabled:opacity-60"
          >
            {resendLoading
              ? "Sending…"
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
          </button>

          <p className="font-ui text-xs text-slate-500">
            Wrong email?{" "}
            <a href="/login" className="font-medium text-slate-900 underline underline-offset-2">
              Sign up again
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
