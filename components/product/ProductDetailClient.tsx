"use client";

import { useTranslations } from "next-intl";
import { unitLabel } from "@/lib/unit-label";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Pencil, Minus, Plus, Home as HomeIcon } from "lucide-react";
import { useProduct, updateProduct } from "@/lib/repositories/products";
import { addHistory } from "@/lib/history";
import { getStockStatus, nextQuantity, prevQuantity } from "@/lib/stock";
import { getLocalePrefix } from "@/lib/locale";
import Header from "@/components/layout/Header";
import BackButton from "@/components/layout/BackButton";

interface Props { id: number; }

export default function ProductDetailClient({ id }: Props) {
  const t = useTranslations();
  const router   = useRouter();
  const pathname = usePathname();
  const product  = useProduct(id);

  // 現在のlocale（ja / zh-TW）を維持したままホームへ戻るリンク
  const homeHref = getLocalePrefix(pathname) || "/";

  // ヘッダー左側：戻る → Home の順
  const headerLeft = (
    <>
      <BackButton />
      <HomeLinkButton href={homeHref} />
    </>
  );

  const toggleFavorite = useCallback(async () => {
    if (!product?.id) return;
    await updateProduct(product.id, { isFavorite: !product.isFavorite });
  }, [product]);

  const handleUse = useCallback(async () => {
    if (!product?.id) return;
    const before = product.quantity;
    const after  = prevQuantity(before);
    await updateProduct(product.id, { quantity: after });
    await addHistory({ productId: product.id, productName: product.name, action: "use",
      quantityBefore: before, quantityAfter: after, unit: product.unit });
  }, [product]);

  const handleAdd = useCallback(async () => {
    if (!product?.id) return;
    const before = product.quantity;
    const after  = nextQuantity(before);
    await updateProduct(product.id, { quantity: after });
    await addHistory({ productId: product.id, productName: product.name, action: "restock",
      quantityBefore: before, quantityAfter: after, unit: product.unit });
  }, [product]);

  if (product === undefined) return (
    <><Header title="" left={headerLeft} /><div className="flex justify-center pt-20"><p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</p></div></>
  );
  if (product === null) return (
    <><Header title={t("product.detail")} left={headerLeft} /><div className="flex justify-center pt-20"><p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("product.notFound")}</p></div></>
  );

  const status = getStockStatus(product);
  const qtyColor = status === "out" ? "#f2524a" : status === "low" ? "#9b87e0" : "var(--text-primary)";

  return (
    <>
      <Header
        title={product.name}
        left={headerLeft}
        right={
          <button
            onClick={() => router.push(`${getLocalePrefix(pathname)}/product/${id}/edit`)}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors active:bg-grad-soft"
            aria-label={t("common.edit")}
          >
            <Pencil size={18} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
          </button>
        }
      />

      <main className="max-w-2xl mx-auto pb-24" style={{ backgroundColor: "var(--bg)" }}>

        {/* 数量セクション */}
        <div className="px-4 pt-8 pb-6 flex flex-col items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {t("product.quantity")}
          </p>
          <div className="flex items-end gap-1">
            <span className="text-6xl font-bold tabular-nums leading-none" style={{ color: qtyColor }}>
              {product.quantity}
            </span>
            <span className="text-xl mb-1" style={{ color: "var(--text-muted)" }}>{unitLabel(product.unit, t)}</span>
          </div>

          {status !== "ok" && (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                background: status === "out" ? "rgba(242,82,74,0.12)" : "rgba(184,169,232,0.18)",
                color:      status === "out" ? "#f2524a" : "#9b87e0",
              }}
            >
              {status === "out" ? t("stock.out") : t("stock.low")}
            </span>
          )}

          {/* 使用 / 補充ボタン */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleUse}
              disabled={product.quantity <= 0}
              className="flex items-center gap-2 px-6 py-3 rounded-ios-lg transition-opacity active:opacity-70 disabled:opacity-25"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              aria-label={t("common.use")}
            >
              <Minus size={16} strokeWidth={2} style={{ color: "var(--text-secondary)" }} />
              <span className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>{t("common.use")}</span>
            </button>
            {/* 補充：グラデーション */}
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-6 py-3 rounded-ios-lg bg-grad text-white transition-opacity active:opacity-80"
              aria-label={t("common.restock")}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="text-[15px] font-semibold">{t("common.restock")}</span>
            </button>
          </div>
        </div>

        {/* 詳細リスト */}
        <div className="list-group">
          <DetailRow label={t("product.name")}>
            <span className="text-[15px] text-right" style={{ color: "var(--text-primary)", wordBreak: "break-all" }}>{product.name}</span>
          </DetailRow>
          <DetailRow label={t("product.category")}>
            <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>{t(`categories.${product.category}`)}</span>
          </DetailRow>
          <DetailRow label={t("product.unit")}>
            <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>{unitLabel(product.unit, t)}</span>
          </DetailRow>
          <DetailRow label={t("product.minStock")}>
            <span className="text-[15px] tabular-nums" style={{ color: "var(--text-primary)" }}>
              {product.minStock}
              <span className="text-[12px] ml-1" style={{ color: "var(--text-muted)" }}>{unitLabel(product.unit, t)}</span>
            </span>
          </DetailRow>
          <DetailRow label={t("product.favorite")} isLast>
            <button
              onClick={toggleFavorite}
              className="flex items-center gap-2 transition-opacity active:opacity-60"
              aria-label={product.isFavorite ? t("product.favoriteRemove") : t("product.favoriteAdd")}
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
                {product.isFavorite ? t("product.favorited") : t("product.notFavorited")}
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
  const t = useTranslations();
  return (
    <Link
      href={href}
      className="flex items-center justify-center w-10 h-10 rounded-full transition-colors active:bg-grad-soft flex-shrink-0"
      aria-label={t("common.home")}
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
