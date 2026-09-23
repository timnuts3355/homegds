"use client";

import { useTranslations } from "next-intl";
import { unitLabel } from "@/lib/unit-label";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight, Star } from "lucide-react";
import type { Product } from "@/types";
import { HOME_SECTION_LIMIT } from "@/lib/constants";
import { getLocalePrefix } from "@/lib/locale";
import { useSwipeQuantity } from "@/hooks/useSwipeQuantity";
import { updateProduct } from "@/lib/repositories/products";

interface StockSectionProps {
  title:        string;
  products:     Product[];
  accentColor:  string;   // バッジ・ドットの色
  dotColor:     string;
  showAllHref:  string;
}

export default function StockSection({
  title, products, accentColor, dotColor, showAllHref,
}: StockSectionProps) {
  const t = useTranslations();
  const visible = products.slice(0, HOME_SECTION_LIMIT);
  const hasMore = products.length > HOME_SECTION_LIMIT;
  if (products.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 px-4 mb-1">
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: accentColor, display: "inline-block" }} />
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {title}
        </p>
        <span
          className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white leading-none"
          style={{ background: accentColor }}
        >
          {products.length}
        </span>
      </div>

      <div className="list-group">
        {visible.map((p, index) => (
          <SwipeableStockRow
            key={p.id}
            product={p}
            dotColor={dotColor}
            isLast={!hasMore && index === visible.length - 1}
          />
        ))}
        {hasMore && (
          <Link href={showAllHref} className="list-row justify-between">
            <span className="text-[14px]" style={{ color: "var(--accent)" }}>{t("common.showAll")}</span>
            <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
          </Link>
        )}
      </div>
    </section>
  );
}

// ── スワイプで数量変更できる行（右：補充 / 左：使用） ──
function SwipeableStockRow({
  product, dotColor, isLast,
}: { product: Product; dotColor: string; isLast: boolean }) {
  const t = useTranslations();
  const router   = useRouter();
  const pathname = usePathname();

  const { offset, flash, handlers } = useSwipeQuantity(product, {
    onTap: () => router.push(`${getLocalePrefix(pathname)}/product/${product.id}`),
  });

  const toggleFavorite = useCallback(async () => {
    await updateProduct(product.id!, { isFavorite: !product.isFavorite });
  }, [product]);

  const flashBg = flash === "add"
    ? "rgba(137,196,225,0.15)"
    : flash === "use"
    ? "rgba(242,82,74,0.08)"
    : "var(--surface)";

  return (
    <div className="relative overflow-hidden">
      {/* スワイプ背景（右スワイプ＝補充） */}
      <div className="absolute inset-0 flex items-center pl-5 pointer-events-none select-none"
        style={{ background: "linear-gradient(135deg,#89c4e1,#b8a9e8)" }}>
        <span className="text-white text-xs font-bold">＋ {t("common.restock")}</span>
      </div>
      {/* スワイプ背景（左スワイプ＝使用） */}
      <div className="absolute inset-0 flex items-center justify-end pr-5 pointer-events-none select-none"
        style={{ background: "linear-gradient(135deg,#b8a9e8,#f2524a)" }}>
        <span className="text-white text-xs font-bold">{t("common.use")} −</span>
      </div>

      <div
        className="list-row relative select-none"
        style={{
          borderBottom: isLast ? "none" : "1px solid var(--border-soft)",
          backgroundColor: flashBg,
          touchAction: "pan-y",
          transform: `translateX(${offset}px)`,
          transition: offset === 0 ? "transform 0.2s ease" : "none",
        }}
        {...handlers}
      >
        {/* ★ お気に入りボタン（スワイプ・タップ遷移とは独立させる） */}
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onPointerMove={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          onPointerCancel={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); void toggleFavorite(); }}
          aria-pressed={product.isFavorite}
          className="flex-shrink-0 flex items-center justify-center"
          aria-label={product.isFavorite ? t("product.favoriteRemove") : t("product.favoriteAdd")}
        >
          {product.isFavorite ? (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <defs>
                <linearGradient id={`starGradHome-${product.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#f2524a" />
                  <stop offset="55%"  stopColor="#b8a9e8" />
                  <stop offset="100%" stopColor="#89c4e1" />
                </linearGradient>
              </defs>
              <polygon fill={`url(#starGradHome-${product.id})`} stroke="none"
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          ) : (
            <Star size={16} strokeWidth={1.8} style={{ color: "var(--border)" }} />
          )}
        </button>

        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span className="flex-1 text-[15px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {product.name}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {t(`categories.${product.category}`)}
        </span>
        <span className="text-[15px] font-bold ml-2 tabular-nums" style={{ color: "var(--text-primary)" }}>
          {product.quantity}
          <span className="text-[11px] font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>{unitLabel(product.unit, t)}</span>
        </span>
      </div>
    </div>
  );
}
