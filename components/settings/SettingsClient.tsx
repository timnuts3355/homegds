"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Moon, Download, Upload, PieChart } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useProducts } from "@/lib/repositories/products";
import { productsToCsv, generateExportFilename } from "@/lib/csv";
import Header from "@/components/layout/Header";
import BackButton from "@/components/layout/BackButton";
import CsvImportModal from "./CsvImportModal";

const LANG_STORAGE_KEY = "homegds_locale";
const LOCALE_COOKIE = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年
type Locale = "ja" | "zh-TW";

export default function SettingsClient() {
  const t          = useTranslations();
  const router     = useRouter();
  const pathname   = usePathname();
  const { dark, toggle } = useTheme();

  const currentLocale = useLocale() as Locale;
  const [showImport, setShowImport] = useState(false);

  const products = useProducts() ?? [];

  const handleLocaleChange = (next: Locale) => {
    if (next === currentLocale) return;
    localStorage.setItem(LANG_STORAGE_KEY, next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
    router.replace(pathname.replace(/^\/(ja|zh-TW)/, `/${next}`));
  };

  const handleExport = () => {
    const csv = productsToCsv(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = generateExportFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header title={t("settings.title")} left={<BackButton />} />
      <main className="max-w-2xl mx-auto pb-24">

        <p className="section-label">{t("settings.sectionApp")}</p>

        <div className="list-group">

          {/* 言語 */}
          <LanguageRow
            label={t("settings.language")}
            currentLocale={currentLocale}
            labelJa={t("settings.languageJa")}
            labelZhTW={t("settings.languageZhTW")}
            onChange={handleLocaleChange}
          />

          {/* ダークモード */}
          <div className="list-row justify-between">
            <div className="flex items-center gap-3">
              <Moon size={18} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
              <span className="text-[15px] text-primary">{t("settings.darkMode")}</span>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={t("settings.darkMode")}
              aria-checked={dark}
              role="switch"
              className="toggle-track"
              style={{ backgroundColor: dark ? "var(--accent)" : "var(--border)" }}
            >
              <div className="toggle-thumb" style={{ left: dark ? "22px" : "2px" }} />
            </button>
          </div>

        </div>

        {/* セクション：データ */}
        <p className="section-label">{t("settings.data")}</p>

        <div className="list-group">

          <Link href={"/" + currentLocale + "/stats"} className="list-row justify-between">
            <div className="flex items-center gap-3">
              <PieChart size={18} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
              <span className="text-[15px] text-primary">{t("stats.title")}</span>
            </div>
            <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
          </Link>

          {/* CSVエクスポート */}
          <button
            type="button"
            onClick={handleExport}
            disabled={products.length === 0}
            className="list-row w-full justify-between text-left disabled:opacity-40"
            style={{ borderBottom: "1px solid var(--border-soft)" }}
          >
            <div className="flex items-center gap-3">
              <Download size={18} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
              <span className="text-[15px] text-primary">{t("settings.export")}</span>
            </div>
            <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
          </button>

          {/* CSVインポート */}
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="list-row w-full justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Upload size={18} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
              <span className="text-[15px] text-primary">{t("settings.import")}</span>
            </div>
            <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
          </button>

        </div>
      </main>

      {showImport && <CsvImportModal onClose={() => setShowImport(false)} />}
    </>
  );
}

// ── 言語選択行 ──
function LanguageRow({
  label, currentLocale, labelJa, labelZhTW, onChange,
}: {
  label: string; currentLocale: Locale;
  labelJa: string; labelZhTW: string;
  onChange: (l: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: "ja"    as Locale, label: labelJa   },
    { value: "zh-TW" as Locale, label: labelZhTW },
  ];
  const currentLabel = currentLocale === "ja" ? labelJa : labelZhTW;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="list-row w-full justify-between text-left"
        style={{ borderBottom: `1px solid var(--border-soft)` }}
      >
        <span className="text-[15px] text-primary">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-secondary">{currentLabel}</span>
          <ChevronRight
            size={15}
            style={{
              color: "var(--text-muted)",
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </div>
      </button>

      {open && (
        <div style={{ borderBottom: `1px solid var(--border-soft)` }}>
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="list-row w-full justify-between text-left"
              style={{
                paddingLeft: 32,
                borderBottom: i < options.length - 1 ? `1px solid var(--border-soft)` : "none",
              }}
            >
              <span
                className="text-[15px]"
                style={{
                  color: currentLocale === opt.value ? "var(--accent)" : "var(--text-primary)",
                  fontWeight: currentLocale === opt.value ? 600 : 400,
                }}
              >
                {opt.label}
              </span>
              {currentLocale === opt.value && (
                <span style={{ color: "var(--accent)", fontSize: 17 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
