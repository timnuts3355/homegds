"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, X, Star, Pencil, Trash2 } from "lucide-react";
import { getDb } from "@/db";
import { addHistory } from "@/lib/history";
import { getStockStatus, sortInventory, nextQuantity, prevQuantity } from "@/lib/stock";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Product } from "@/types";
import Header from "@/components/layout/Header";

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX       = 80;

interface SwipeState { startX: number; currentX: number; active: boolean; }

export default function InventoryClient() {
  const [query, setQuery] = useState("");
  const allProducts = useLiveQuery(() => getDb().products.toArray(), []) ?? [];
  const filtered = sortInventory(
    query.trim()
      ? allProducts.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()))
      : allProducts
  );

  return (
    <>
      <Header title="在庫" />
      <main className="max-w-2xl mx-auto pb-24" style={{ backgroundColor: "var(--bg)" }}>
        <SearchBar value={query} onChange={setQuery} />
        {filtered.length === 0 ? (
          <EmptyState hasQuery={query.trim().length > 0} />
        ) : (
          <div className="list-group">
            {filtered.map((product, index) => (
              <InventoryRow
                key={product.id}
                product={product}
                isLast={index === filtered.length - 1}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

// ── 検索バー ──
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="px-4 py-2">
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3 pointer-events-none" style={{ color: "var(--text-muted)" }} strokeWidth={2} />
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="商品名で検索"
          className="form-input pl-9 pr-8 py-2 text-sm"
          style={{ backgroundColor: "var(--surface-alt)", border: "none" }}
        />
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="absolute right-2.5" style={{ color: "var(--text-muted)" }} aria-label="検索をクリア">
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── 商品行 ──
function InventoryRow({ product, isLast }: { product: Product; isLast: boolean }) {
  const router = useRouter();
  const [offset, setOffset]               = useState(0);
  const [flash, setFlash]                 = useState<"add" | "use" | null>(null);
  const [longPressMenu, setLongPressMenu] = useState(false);
  const swipe     = useRef<SwipeState>({ startX: 0, currentX: 0, active: false });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSwipe  = useRef(false);
  const status    = getStockStatus(product);

  const updateQty = useCallback(async (next: number, action: "use" | "restock") => {
    const before = product.quantity;
    await getDb().products.update(product.id!, { quantity: next, updatedAt: new Date() });
    await addHistory({ productId: product.id!, productName: product.name,
      action, quantityBefore: before, quantityAfter: next, unit: product.unit });
  }, [product]);

  const deleteProduct = useCallback(async () => {
    await addHistory({ productId: product.id!, productName: product.name, action: "delete",
      quantityBefore: product.quantity, quantityAfter: null, unit: product.unit });
    await getDb().products.delete(product.id!);
  }, [product]);

  const toggleFavorite = useCallback(async () => {
    await getDb().products.update(product.id!, { isFavorite: !product.isFavorite, updatedAt: new Date() });
  }, [product]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    didSwipe.current = false;
    holdTimer.current = setTimeout(() => setLongPressMenu(true), 500);
    swipe.current = { startX: e.clientX, currentX: e.clientX, active: true };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipe.current.active) return;
    const dx = e.clientX - swipe.current.startX;
    if (Math.abs(dx) > 8) {
      didSwipe.current = true;
      if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    }
    swipe.current.currentX = e.clientX;
    setOffset(Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx)));
  };
  const onPointerUp = async () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    swipe.current.active = false;
    const dx = swipe.current.currentX - swipe.current.startX;
    setOffset(0);
    if (dx > SWIPE_THRESHOLD) {
      await updateQty(nextQuantity(product.quantity), "restock");
      setFlash("add"); setTimeout(() => setFlash(null), 600);
    } else if (dx < -SWIPE_THRESHOLD) {
      await updateQty(prevQuantity(product.quantity), "use");
      setFlash("use"); setTimeout(() => setFlash(null), 600);
    } else if (!didSwipe.current) {
      router.push(`/product/${product.id}`);
    }
  };

  // ステータスドット色
  const dotColor = status === "out" ? "#f2524a" : status === "low" ? "#b8a9e8" : "var(--border)";
  const qtyStyle = status === "out"
    ? { color: "#f2524a" }
    : status === "low"
    ? { color: "#9b87e0" }
    : { color: "var(--text-primary)" };

  // フラッシュ背景
  const flashBg = flash === "add"
    ? "rgba(137,196,225,0.15)"
    : flash === "use"
    ? "rgba(242,82,74,0.08)"
    : "var(--surface)";

  return (
    <>
      {longPressMenu && (
        <LongPressMenu
          productName={product.name}
          onEdit={() => { setLongPressMenu(false); router.push(`/product/${product.id}/edit`); }}
          onDelete={async () => { setLongPressMenu(false); await deleteProduct(); }}
          onClose={() => setLongPressMenu(false)}
        />
      )}

      <div className="relative overflow-hidden">
        {/* スワイプ背景 */}
        <div className="absolute inset-0 flex items-center pl-5 pointer-events-none select-none"
          style={{ background: "linear-gradient(135deg,#89c4e1,#b8a9e8)" }}>
          <span className="text-white text-xs font-bold">＋ 補充</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-end pr-5 pointer-events-none select-none"
          style={{ background: "linear-gradient(135deg,#b8a9e8,#f2524a)" }}>
          <span className="text-white text-xs font-bold">使用 −</span>
        </div>

        {/* 行本体 */}
        <div
          className="relative flex items-center select-none"
          style={{
            backgroundColor: flashBg,
            borderBottom: isLast ? "none" : "1px solid var(--border-soft)",
            transform: `translateX(${offset}px)`,
            transition: swipe.current.active ? "none" : "transform 0.2s ease",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* ★ お気に入りボタン（グラデーション） */}
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onClick={toggleFavorite}
            className="flex-shrink-0 flex items-center justify-center pl-4 pr-2 py-3"
            aria-label={product.isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
          >
            {product.isFavorite ? (
              /* ON：グラデーション塗り */
              <svg width="16" height="16" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#f2524a" />
                    <stop offset="55%"  stopColor="#b8a9e8" />
                    <stop offset="100%" stopColor="#89c4e1" />
                  </linearGradient>
                </defs>
                <polygon fill="url(#starGrad)" stroke="none"
                  points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ) : (
              /* OFF：グレー線画 */
              <Star size={16} strokeWidth={1.8} style={{ color: "var(--border)" }} />
            )}
          </button>

          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />

          <span className="flex-1 min-w-0 text-[15px] font-medium truncate ml-2" style={{ color: "var(--text-primary)" }}>
            {product.name}
          </span>
          <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
            {CATEGORY_LABELS[product.category]}
          </span>
          <span className="text-[11px] flex-shrink-0 ml-2 tabular-nums" style={{ color: "var(--text-muted)" }}>
            最低{product.minStock}{product.unit}
          </span>
          <span className="text-[15px] font-bold flex-shrink-0 ml-2 mr-4 tabular-nums" style={qtyStyle}>
            {product.quantity}
            <span className="text-[11px] font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>{product.unit}</span>
          </span>
        </div>
      </div>
    </>
  );
}

// ── 長押しメニュー ──
function LongPressMenu({
  productName, onEdit, onDelete, onClose,
}: { productName: string; onEdit: () => void; onDelete: () => void; onClose: () => void; }) {
  return (
    <div className="modal-overlay flex items-end justify-center pb-10 px-4" onClick={onClose}>
      <div className="w-full max-w-sm modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 modal-divider" style={{ borderBottom: "0.5px solid var(--glass-border)" }}>
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-secondary)" }}>{productName}</p>
        </div>
        <button onClick={onEdit} className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors active:bg-grad-soft"
          style={{ borderBottom: "0.5px solid var(--glass-border)" }}>
          <Pencil size={17} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
          <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>編集</span>
        </button>
        <button onClick={onDelete} className="w-full flex items-center gap-3 px-5 py-4 text-left active:opacity-70">
          <Trash2 size={17} strokeWidth={1.8} style={{ color: "#f2524a" }} />
          <span className="text-[15px]" style={{ color: "#f2524a" }}>削除</span>
        </button>
      </div>
    </div>
  );
}

// ── Empty State ──
function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="list-group">
      <div className="flex justify-center items-center py-14">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {hasQuery ? "該当する商品が見つかりません" : "商品が登録されていません"}
        </p>
      </div>
    </div>
  );
}
