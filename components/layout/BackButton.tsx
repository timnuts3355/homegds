"use client";

import { useTranslations } from "next-intl";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocalePrefix } from "@/lib/locale";

// ============================================================
// 共通「戻る」ボタン（ヘッダー左端）
// 同じlocaleのアプリ内履歴と確認できれば router.back()、
// 無ければ現在のlocaleを維持したままHomeへ遷移する。
// ============================================================

export default function BackButton() {
  const t = useTranslations();
  const router   = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.state?.homegdsEntry?.canGoBack &&
        window.history.state.homegdsEntry.locale === getLocalePrefix(pathname)) {
      router.back();
    } else {
      router.push(getLocalePrefix(pathname) || "/");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center w-10 h-10 rounded-full transition-colors active:bg-grad-soft -ml-1.5 flex-shrink-0"
      aria-label={t("common.back")}
    >
      <ArrowLeft size={19} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
    </button>
  );
}
