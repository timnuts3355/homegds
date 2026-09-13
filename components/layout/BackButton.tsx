"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocalePrefix } from "@/lib/locale";

// ============================================================
// 共通「戻る」ボタン（ヘッダー左端）
// 戻れる履歴があれば router.back()、
// 無ければ現在のlocaleを維持したままHomeへ遷移する。
// ============================================================

export default function BackButton() {
  const router   = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
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
      aria-label="戻る"
    >
      <ArrowLeft size={19} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
    </button>
  );
}
