"use client";

import { useRef, useState } from "react";
import { nextQuantity, prevQuantity } from "@/lib/stock";

// ============================================================
// 横スワイプによる数量変更（補充 / 使用）の共通フック
// Inventory と同じ数量ステップ（nextQuantity / prevQuantity）を利用する。
// 保存先（Dexie / Firestore）に依存しないよう、数量の書き込みと履歴記録は
// 呼び出し側が onChangeQuantity として渡す（現在はHomeのみFirestore版を渡す）。
// ============================================================

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX       = 80;

interface SwipeState { startY: number; startX: number; currentX: number; active: boolean; }

export type SwipeQuantityAction = "use" | "restock";

interface SwipeQuantityOptions {
  onChangeQuantity: (next: number, action: SwipeQuantityAction) => Promise<void>;
  onTap?: () => void;
}

export function useSwipeQuantity(product: { quantity: number }, options: SwipeQuantityOptions) {
  const [offset, setOffset] = useState(0);
  const [flash, setFlash]   = useState<"add" | "use" | null>(null);
  const swipe     = useRef<SwipeState>({ startY: 0, startX: 0, currentX: 0, active: false });
  const didSwipe  = useRef(false);

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
      await options.onChangeQuantity(nextQuantity(product.quantity), "restock");
      setFlash("add"); setTimeout(() => setFlash(null), 600);
    } else if (dx < -SWIPE_THRESHOLD) {
      await options.onChangeQuantity(prevQuantity(product.quantity), "use");
      setFlash("use"); setTimeout(() => setFlash(null), 600);
    } else if (!didSwipe.current) {
      options.onTap?.();
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
