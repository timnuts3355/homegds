"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Pencil, Minus, Plus, Home as HomeIcon } from "lucide-react";
import { getDb } from "@/db";
import { addHistory } from "@/lib/history";
import { getStockStatus, nextQuantity, prevQuantity } from "@/lib/stock";
import { CATEGORY_LABELS } from "@/lib/constants";
import Header from "@/components/layout/Header";

interface Props { id: number; }

export default function ProductDetailClient({ id }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const product  = useLiveQuery(() => getDb().products.get(id), [id]);

  // 現在のlocale（ja / zh-TW）を維持したままホームへ戻るリンク
  const localePrefix = pathname.match(/^\/(ja|zh-TW)/)?.[0] ?? "";
  const homeHref = localePrefix || "/";

  const toggleFavorite = useCallback(async () => {
    if (!product?.id) return;
    await getDb().products.update(product.id, { isFavorite: !product.isFavorite, updatedAt: new Date() });
  }, [product]);

  const handleUse = useCallback(async () => {
    if (!product?.id) return;
    const before = product.quantity;
    const after  = prevQuantity(before);
    await getDb().products.update(product.id, { quantity: after, updatedAt: new Date() });
    await addHistory({ productId: product.id, productName: product.name, action: "use",
      quantityBefore: before, quantityAfter: after, unit: product.unit });
  }, [product]);

  const handleAdd = useCallback(async () => {
    if (!product?.id) return;
    const before = product.quantity;
    const after  = nextQuantity(before);
    await getDb().products.update(product.id, { quantity: after, updatedAt: new Date() });
    await addHistory({ productId: product.id, productName: product.name, action: "restock",
      quantityBefore: before, quantityAfter: after, unit: product.unit });
  }, [product]);

  if (product === undefined) return (
    <><Header title="" left={<HomeLinkButton href={homeHref} />} /><div className="flex justify-center pt-20"><p className="text-sm" style={{ color: "var(--text-muted)" }}>読み込み中…</p></div></>
  );
  if (product === null) return (
    <><Header title="商品詳細" left={<HomeLinkButton href={homeHref} />} /><div className="flex justify-center pt-20"><p className="text-sm" style={{ color: "var(--text-muted)" }}>商品が見つかりません</p></div></>
  );

  const status = getStockStatus(product);
  const qtyColor = status === "out" ? "#f2524a" : status === "low" ? "#9b87e0" : "var(--text-primary)";

  return (
    <>
      <Header
        title={product.name}
        left={<HomeLinkButton href={homeHref} />}
        right={
          <button
            onClick={() => router.push(`/product/${id}/edit`)}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors active:bg-grad-soft"
            aria-label="編集"
          >
            <Pencil size={18} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
          </button>
        }
      />

      <main className="max-w-2xl mx-auto pb-24" style={{ backgroundColor: "var(--bg)" }}>

        {/* 数量セクション */}
        <div className="px-4 pt-8 pb-6 flex flex-col items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            現在の在庫
          </p>
          <div className="flex items-end gap-1">
            <span className="text-6xl font-bold tabular-nums leading-none" style={{ color: qtyColor }}>
              {product.quantity}
            </span>
            <span className="text-xl mb-1" style={{ color: "var(--text-muted)" }}>{product.unit}</span>
          </div>

          {status !== "ok" && (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                background: status === "out" ? "rgba(242,82,74,0.12)" : "rgba(184,169,232,0.18)",
                color:      status === "out" ? "#f2524a" : "#9b87e0",
              }}
            >
              {status === "out" ? "在庫不足" : "在庫が少ない"}
            </span>
          )}

          {/* 使用 / 補充ボタン */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleUse}
              disabled={product.quantity <= 0}
              className="flex items-center gap-2 px-6 py-3 rounded-ios-lg transition-opacity active:opacity-70 disabled:opacity-25"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              aria-label="使用"
            >
              <Minus size={16} strokeWidth={2} style={{ color: "var(--text-secondary)" }} />
              <span className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>使用</span>
            </button>
            {/* 補充：グラデーション */}
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-6 py-3 rounded-ios-lg bg-grad text-white transition-opacity active:opacity-80"
              aria-label="補充"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="text-[15px] font-semibold">補充</span>
            </button>
          </div>
        </div>

        {/* 詳細リスト */}
        <div className="list-group">
          <DetailRow label="商品名">
            <span className="text-[15px] text-right" style={{ color: "var(--text-primary)", wordBreak: "break-all" }}>{product.name}</span>
          </DetailRow>
          <DetailRow label="カテゴリ">
            <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>{CATEGORY_LABELS[product.category]}</span>
          </DetailRow>
          <DetailRow label="単位">
            <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>{product.unit}</span>
          </DetailRow>
          <DetailRow label="最低在庫">
            <span className="text-[15px] tabular-nums" style={{ color: "var(--text-primary)" }}>
              {product.minStock}
              <span className="text-[12px] ml-1" style={{ color: "var(--text-muted)" }}>{product.unit}</span>
            </span>
          </DetailRow>
          <DetailRow label="お気に入り" isLast>
            <button
              onClick={toggleFavorite}
              className="flex items-center gap-2 transition-opacity active:opacity-60"
              aria-label={product.isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
            >
              {product.isFavorite ? (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="starGradD" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#f2524a" />
                      <stop offset="55%"  stopColor="#b8a9e8" />
                      <stop offset="100%" stopColor="#89c4e1" />
                    </linearGradient>
                  </defs>
                  <polygon fill="url(#starGradD)" stroke="none"
                    points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="var(--border)" strokeWidth="1.8">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              )}
              <span className="text-[15px]" style={{ color: product.isFavorite ? "#9b87e0" : "var(--text-muted)" }}>
                {product.isFavorite ? "登録済み" : "未登録"}
              </span>
            </button>
          </DetailRow>
        </div>
      </main>
    </>
  );
}

// ── ホームへ戻るボタン（locale維持） ──
function HomeLinkButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center w-9 h-9 rounded-full transition-colors active:bg-grad-soft -ml-1.5 flex-shrink-0"
      aria-label="ホームへ戻る"
    >
      <HomeIcon size={18} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
    </Link>
  );
}

function DetailRow({ label, children, isLast = false }: {
  label: string; children: React.ReactNode; isLast?: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between px-4 py-3 gap-3"
      style={{ borderBottom: isLast ? "none" : "1px solid var(--border-soft)" }}
    >
      <span className="text-[13px] font-medium flex-shrink-0 pt-0.5" style={{ color: "var(--text-muted)", width: "5rem" }}>{label}</span>
      <div className="flex-1 flex justify-end min-w-0">{children}</div>
    </div>
  );
}
