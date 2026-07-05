"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, Package, Clock, Settings } from "lucide-react";

// ホーム・在庫・履歴・設定の4タブ
type TabId = "home" | "inventory" | "history" | "settings";

const TAB_ICONS: Record<TabId, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
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

const HIDE_TABBAR_PATTERN = /^\/(add|product\/)/;

export default function TabBar() {
  const pathname     = usePathname();
  const t            = useTranslations("nav");
  const cleanPath    = pathname.replace(/^\/(ja|zh-TW)/, "") || "/";
  const localePrefix = pathname.match(/^\/(ja|zh-TW)/)?.[0] ?? "";

  if (HIDE_TABBAR_PATTERN.test(cleanPath)) return null;

  const tabs: TabId[] = ["home", "inventory", "history", "settings"];

  return (
    <nav className="tab-bar" aria-label="メインナビゲーション">
      <div className="flex w-full max-w-2xl mx-auto pb-safe">
        {tabs.map((tabId) => {
          const Icon     = TAB_ICONS[tabId];
          const href     = localePrefix + TAB_HREFS[tabId];
          const isActive =
            TAB_HREFS[tabId] === "/"
              ? cleanPath === "/"
              : cleanPath.startsWith(TAB_HREFS[tabId]);

          return (
            <Link
              key={tabId}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-opacity duration-100"
              style={{ color: isActive ? "transparent" : "var(--text-muted)" }}
              aria-current={isActive ? "page" : undefined}
            >
              {/* アクティブ時：グラデーション色をcolorで渡す（型安全） */}
              {isActive ? (
                <span className="relative flex items-center justify-center">
                  <Icon
                    size={24}
                    strokeWidth={2.2}
                    color="#b8a9e8"
                  />
                </span>
              ) : (
                <Icon size={24} strokeWidth={1.6} color="var(--text-muted)" />
              )}
              <span
                className={`text-[10px] leading-none ${isActive ? "font-semibold text-grad" : "font-medium"}`}
                style={isActive ? {} : { color: "var(--text-muted)" }}
              >
                {t(tabId)}
              </span>
              {/* アクティブドット */}
              {isActive && <span className="tab-active-dot" />}
            </Link>
          );
        })}
      </div>

    </nav>
  );
}
