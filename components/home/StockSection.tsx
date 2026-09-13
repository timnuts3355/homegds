"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/types";
import { CATEGORY_LABELS, HOME_SECTION_LIMIT } from "@/lib/constants";
import { getLocalePrefix } from "@/lib/locale";
import { useSwipeQuantity } from "@/hooks/useSwipeQuantity";

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
            <span className="text-[14px]" style={{ color: "var(--accent)" }}>すべて見る</span>
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
  const router   = useRouter();
  const pathname = usePathname();

  const { offset, flash, handlers } = useSwipeQuantity(product, {
    onTap: () => router.push(`${getLocalePrefix(pathname)}/product/${product.id}`),
  });

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
        <span className="text-white text-xs font-bold">＋ 補充</span>
      </div>
      {/* スワイプ背景（左スワイプ＝使用） */}
      <div className="absolute inset-0 flex items-center justify-end pr-5 pointer-events-none select-none"
        style={{ background: "linear-gradient(135deg,#b8a9e8,#f2524a)" }}>
        <span className="text-white text-xs font-bold">使用 −</span>
      </div>

      <div
        className="list-row relative select-none"
        style={{
          borderBottom: isLast ? "none" : "1px solid var(--border-soft)",
          backgroundColor: flashBg,
          transform: `translateX(${offset}px)`,
          transition: offset === 0 ? "transform 0.2s ease" : "none",
        }}
        {...handlers}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span className="flex-1 text-[15px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {product.name}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {CATEGORY_LABELS[product.category]}
        </span>
        <span className="text-[15px] font-bold ml-2 tabular-nums" style={{ color: "var(--text-primary)" }}>
          {product.quantity}
          <span className="text-[11px] font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>{product.unit}</span>
        </span>
      </div>
    </div>
  );
}
