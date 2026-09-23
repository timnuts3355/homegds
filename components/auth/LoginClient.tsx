"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export default function LoginClient() {
  const t      = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      router.replace(`/${locale}`);
    } catch {
      setError(t("auth.loginError"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <h1 className="text-center text-[22px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          homegds
        </h1>
        <p className="text-center text-[13px] mb-8" style={{ color: "var(--text-muted)" }}>
          {t("auth.subtitle")}
        </p>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {t("auth.email")}
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {t("auth.password")}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#f2524a" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-grad disabled:opacity-40 text-white font-semibold text-base py-3.5 rounded-ios-lg transition-opacity active:opacity-80 mt-2"
          >
            {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
