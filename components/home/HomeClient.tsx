"use client";

import { useLocale, useTranslations } from "next-intl";

import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { useProducts } from "@/lib/repositories/products";
import { filterOut, filterLow } from "@/lib/stock";
import Header from "@/components/layout/Header";
import StockSection from "./StockSection";

export default function HomeClient() {
  const t = useTranslations();
  const locale = useLocale();
  const products    = useProducts() ?? [];
  const outProducts = filterOut(products);
  const lowProducts = filterLow(products);
  const hasAny      = outProducts.length > 0 || lowProducts.length > 0;

  return (
    <>
      <Header
        title="homegds"
        right={
          <Link
            href={`/${locale}/add`}
            className="flex items-center gap-1.5 text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-full bg-grad transition-opacity active:opacity-80"
            aria-label={t("product.add")}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{t("common.add")}</span>
          </Link>
        }
      />

      <main className="max-w-2xl mx-auto pt-4 pb-24" style={{ backgroundColor: "var(--bg)" }}>
        {!hasAny ? <EmptyState /> : (
          <>
            <StockSection
              title={t("stock.out")}
              products={outProducts}
              accentColor="#f2524a"
              dotColor="#f87168"
              showAllHref={`/${locale}/inventory?filter=out`}
            />
            <StockSection
              title={t("stock.low")}
              products={lowProducts}
              accentColor="#b8a9e8"
              dotColor="#c4b5fc"
              showAllHref={`/${locale}/inventory?filter=low`}
            />
          </>
        )}
      </main>
    </>
  );
}

function EmptyState() {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <div className="flex flex-col items-center justify-center mt-20 px-8 text-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-grad-soft"
      >
        <Package size={26} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
        {t("home.empty")}
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {t("home.emptyHint")}
      </p>
      <Link
        href={`/${locale}/add`}
        className="mt-2 flex items-center gap-1.5 text-white text-[14px] font-semibold px-5 py-2.5 rounded-full bg-grad transition-opacity active:opacity-80"
      >
        <Plus size={15} strokeWidth={2.5} />
        {t("product.addAction")}
      </Link>
    </div>
  );
}
