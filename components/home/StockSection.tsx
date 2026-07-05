"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/types";
import { CATEGORY_LABELS, HOME_SECTION_LIMIT } from "@/lib/constants";

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
        {visible.map((p) => (
          <div key={p.id} className="list-row">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
            <span className="flex-1 text-[15px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {p.name}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {CATEGORY_LABELS[p.category]}
            </span>
            <span className="text-[15px] font-bold ml-2 tabular-nums" style={{ color: "var(--text-primary)" }}>
              {p.quantity}
              <span className="text-[11px] font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>{p.unit}</span>
            </span>
          </div>
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
