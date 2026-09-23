"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, Package, Clock, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ホーム・在庫・履歴・設定の4タブ
type TabId = "home" | "inventory" | "history" | "settings";

const TAB_ICONS: Record<TabId, LucideIcon> = {
  home:      Home,
  inventory: Package,
  history:   Clock,
  settings:  Settings,
};

const TAB_HREFS: Record<TabId, string> = {
  home:      "/",
  inventory: "/inventory",
  history:   "/history",
  settings:  "/settings",
};

const HIDE_TABBAR_PATTERN = /^\/(add|product\/|login)/;

export default function TabBar() {
  const pathname     = usePathname();
  const t            = useTranslations();
  const cleanPath    = pathname.replace(/^\/(ja|zh-TW)/, "") || "/";
  const localePrefix = pathname.match(/^\/(ja|zh-TW)/)?.[0] ?? "";

  if (HIDE_TABBAR_PATTERN.test(cleanPath)) return null;

  const tabs: TabId[] = ["home", "inventory", "history", "settings"];

  return (
    <nav className="tab-bar" aria-label={t("common.mainNav")}>
      <div className="flex w-full max-w-2xl mx-auto pb-safe">
        {tabs.map((tabId) => {
          const Icon     = TAB_ICONS[tabId];
          const href     = localePrefix + TAB_HREFS[tabId];
          const isActive =
            TAB_HREFS[tabId] === "/"
              ? cleanPath === "/"
              : cleanPath.startsWith(TAB_HREFS[tabId]);

          const iconClass = isActive
            ? "text-[#b8a9e8]"
            : "text-[var(--text-muted)]";

          return (
            <Link
              key={tabId}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-opacity duration-100 ${iconClass}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.2 : 1.6}
                className={iconClass}
              />
              <span
                className={`text-[10px] leading-none ${
                  isActive ? "font-semibold text-grad" : "font-medium"
                }`}
              >
                {t(`nav.${tabId}`)}
              </span>
              {isActive && <span className="tab-active-dot" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
