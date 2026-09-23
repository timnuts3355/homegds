"use client";

import { useCallback, useRef, useState } from "react";
import { updateProduct } from "@/lib/repositories/products";
import { addHistory } from "@/lib/history";
import { nextQuantity, prevQuantity } from "@/lib/stock";
import type { Product } from "@/types";

// ============================================================
// 横スワイプによる数量変更（補充 / 使用）の共通フック
// Inventory と同じ数量ステップ（nextQuantity / prevQuantity）・
// 履歴記録（addHistory）ルールをそのまま利用する。
// ============================================================

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX       = 80;

interface SwipeState { startY: number; startX: number; currentX: number; active: boolean; }

export function useSwipeQuantity(product: Product, options?: { onTap?: () => void }) {
  const [offset, setOffset] = useState(0);
  const [flash, setFlash]   = useState<"add" | "use" | null>(null);
  const swipe     = useRef<SwipeState>({ startY: 0, startX: 0, currentX: 0, active: false });
  const didSwipe  = useRef(false);

  const updateQty = useCallback(async (next: number, action: "use" | "restock") => {
    const before = product.quantity;
    await updateProduct(product.id!, { quantity: next });
    await addHistory({
      productId: product.id!, productName: product.name,
      action, quantityBefore: before, quantityAfter: next, unit: product.unit,
    });
  }, [product]);

  const onPointerCancel = () => {
    swipe.current.active = false;
    didSwipe.current = true;
    setOffset(0);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    didSwipe.current = false;
    swipe.current = { startY: e.clientY, startX: e.clientX, currentX: e.clientX, active: true };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipe.current.active) return;
    swipe.current.currentX = e.clientX;
    const dx = e.clientX - swipe.current.startX;
    const dy = e.clientY - swipe.current.startY;
    if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
      onPointerCancel();
      return;
    }
    if (Math.abs(dx) > 8) didSwipe.current = true;
    setOffset(Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx)));
  };

  const onPointerUp = async () => {
    if (!swipe.current.active) return;
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
      options?.onTap?.();
    }
  };

  return {
    offset,
    flash,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
