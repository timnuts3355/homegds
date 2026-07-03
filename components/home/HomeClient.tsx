"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { getDb } from "@/db";
import { filterOut, filterLow } from "@/lib/stock";
import Header from "@/components/layout/Header";
import StockSection from "./StockSection";

export default function HomeClient() {
  const products    = useLiveQuery(() => getDb().products.toArray(), []) ?? [];
  const outProducts = filterOut(products);
  const lowProducts = filterLow(products);
  const hasAny      = outProducts.length > 0 || lowProducts.length > 0;

  return (
    <>
      <Header
        title="homegds"
        right={
          <Link
            href="/add"
            className="flex items-center gap-1.5 text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-full bg-grad transition-opacity active:opacity-80"
            aria-label="商品を追加"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>追加</span>
          </Link>
        }
      />

      <main className="max-w-2xl mx-auto pt-4 pb-24" style={{ backgroundColor: "var(--bg)" }}>
        {!hasAny ? <EmptyState /> : (
          <>
            <StockSection
              title="在庫不足"
              products={outProducts}
              accentColor="#f2524a"
              dotColor="#f87168"
              showAllHref="/inventory?filter=out"
            />
            <StockSection
              title="在庫が少ない"
              products={lowProducts}
              accentColor="#b8a9e8"
              dotColor="#c4b5fc"
              showAllHref="/inventory?filter=low"
            />
          </>
        )}
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center mt-20 px-8 text-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-grad-soft"
      >
        <Package size={26} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
        補充が必要な商品はありません
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        右上の「追加」から商品を登録すると、<br />
        補充が必要なものがここに表示されます。
      </p>
      <Link
        href="/add"
        className="mt-2 flex items-center gap-1.5 text-white text-[14px] font-semibold px-5 py-2.5 rounded-full bg-grad transition-opacity active:opacity-80"
      >
        <Plus size={15} strokeWidth={2.5} />
        商品を追加する
      </Link>
    </div>
  );
}
