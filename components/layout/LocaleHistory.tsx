"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getLocalePrefix } from "@/lib/locale";

// Only navigate back when an observed app navigation proves the previous locale.
export default function LocaleHistory() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const last = useRef<{ locale: string; length: number } | null>(null);
  useEffect(() => {
    const url = pathname + (search ? "?" + search : "");
    const locale = getLocalePrefix(pathname);
    const existing = window.history.state?.homegdsEntry;
    if (existing?.url !== url) {
      window.history.replaceState({
        ...window.history.state,
        homegdsEntry: {
          url,
          locale,
          canGoBack: last.current?.locale === locale && window.history.length > last.current.length,
        },
      }, "");
    }
    last.current = { locale, length: window.history.length };
  }, [pathname, search]);
  return null;
}
