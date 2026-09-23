"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/firebase/AuthProvider";
import { getLocalePrefix } from "@/lib/locale";

// ============================================================
// 未ログイン時は /{locale}/login へ誘導し、ログイン済みで
// /{locale}/login を開いた場合はHomeへ戻す。
// /login自体はガード対象から除外し、リダイレクトループを防ぐ。
// ============================================================

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const t        = useTranslations();
  const pathname = usePathname();
  const router   = useRouter();

  const localePrefix = getLocalePrefix(pathname);
  const isLoginPage  = pathname === `${localePrefix}/login`;

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) {
      router.replace(`${localePrefix}/login`);
    } else if (user && isLoginPage) {
      router.replace(localePrefix || "/");
    }
  }, [loading, user, isLoginPage, localePrefix, router]);

  if (loading) {
    return (
      <div className="flex justify-center pt-24">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</p>
      </div>
    );
  }

  // 未ログイン・非ログイン画面 → リダイレクト完了までは何も描画しない
  if (!user && !isLoginPage) return null;
  // ログイン済みなのにログイン画面 → リダイレクト完了までは何も描画しない
  if (user && isLoginPage) return null;

  return <>{children}</>;
}
