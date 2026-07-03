// ============================================================
// homegds 型定義
// ============================================================

export type Category =
  | "food" | "beverage" | "daily" | "medicine" | "other";

export type Unit =
  | "個" | "本" | "袋" | "箱" | "缶" | "枚"
  | "g" | "kg" | "ml" | "L" | "その他";

export interface Product {
  id?: number;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  minStock: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export type StockStatus = "out" | "low" | "ok";

// ============================================================
// 履歴
// ============================================================

export type HistoryAction =
  | "add"
  | "use"
  | "restock"
  | "edit"
  | "delete";

export interface HistoryEntry {
  id?: number;
  productId: number;
  productName: string;
  action: HistoryAction;
  quantityBefore: number | null;
  quantityAfter:  number | null;
  unit: string;
  createdAt: Date;
}
