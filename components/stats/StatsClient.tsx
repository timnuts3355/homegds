"use client";

import { useTranslations } from "next-intl";
import { useProducts } from "@/lib/repositories/products";
import { CATEGORIES } from "@/lib/constants";
import Header from "@/components/layout/Header";
import BackButton from "@/components/layout/BackButton";

const COLORS = ["#f2524a", "#9b87e0", "#5baed4", "#45977a", "#d29b36"];

export default function StatsClient() {
  const t = useTranslations();
  const products = useProducts();
  const total = products?.length ?? 0;
  let angle = 0;
  const categories = CATEGORIES.map((category, index) => {
    const count = products?.filter(product => product.category === category.value).length ?? 0;
    const start = angle;
    angle += total ? count / total * 360 : 0;
    return { ...category, count, start, end: angle, color: COLORS[index] };
  });
  const visible = categories.filter(category => category.count > 0);
  const gradient = visible.map(category =>
    category.color + " " + category.start + "deg " + category.end + "deg"
  ).join(", ");

  return (
    <>
      <Header title={t("stats.title")} left={<BackButton />} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <h2 className="text-center text-[15px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          {t("stats.byCategory")}
        </h2>
        <p className="text-center text-xs mb-6" style={{ color: "var(--text-muted)" }}>{t("stats.note")}</p>
        {products === undefined ? (
          <p role="status" className="text-center py-12" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</p>
        ) : total === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>{t("stats.empty")}</p>
        ) : (
          <figure className="mx-auto max-w-sm">
            <div role="img" aria-label={t("stats.byCategory")} aria-describedby="category-legend"
              className="mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-full"
              style={{ background: "conic-gradient(" + gradient + ")" }} />
            <figcaption id="category-legend" className="mt-6">
              <ul className="list-group">
                {visible.map(category => (
                  <li key={category.value} className="list-row gap-3">
                    <span aria-hidden="true" className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                    <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{t("categories." + category.value)}</span>
                    <span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{t("stats.count", { count: category.count })}</span>
                    <span className="w-16 text-right text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>{(category.count / total * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </figcaption>
          </figure>
        )}
      </main>
    </>
  );
}
