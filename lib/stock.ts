import type { Product, StockStatus } from "@/types";
import { LOW_STOCK_RATIO } from "./constants";

export function getStockStatus(p: Product): StockStatus {
  if (p.quantity < p.minStock) return "out";
  if (p.quantity < p.minStock * LOW_STOCK_RATIO) return "low";
  return "ok";
}

/** 在庫ステータスの並び順重み（小さい＝先） */
const STATUS_ORDER: Record<StockStatus, number> = { out: 0, low: 1, ok: 2 };

/**
 * 在庫一覧のデフォルトソート
 * お気に入り → 在庫不足 → 在庫少ない → その他
 */
export function sortInventory(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    // お気に入りを最優先
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    // 次にステータス順
    const sa = STATUS_ORDER[getStockStatus(a)];
    const sb = STATUS_ORDER[getStockStatus(b)];
    if (sa !== sb) return sa - sb;
    // 同率なら名前昇順
    return a.name.localeCompare(b.name, "ja");
  });
}

export function filterOut(products: Product[]): Product[] {
  return products.filter((p) => getStockStatus(p) === "out");
}

export function filterLow(products: Product[]): Product[] {
  return products.filter((p) => getStockStatus(p) === "low");
}

/**
 * 数量の次の値（スワイプ補充用）
 * 0 → 0.5 → 1 → 2 → 3 → … （整数ステップ）
 */
export function nextQuantity(current: number): number {
  if (current < 0.5) return 0.5;
  if (current < 1)   return 1;
  return Math.floor(current) + 1;
}

/**
 * 数量の前の値（スワイプ使用用）
 * 0.5 → 0、1 → 0.5、2 → 1、3 → 2、…
 */
export function prevQuantity(current: number): number {
  if (current <= 0)  return 0;
  if (current <= 0.5) return 0;
  if (current <= 1)  return 0.5;
  return Math.ceil(current) - 1;
}
