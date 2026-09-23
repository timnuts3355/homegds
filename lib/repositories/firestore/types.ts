import type { Category, Unit, HistoryAction } from "@/types";

// ============================================================
// Firestore版データ型（Phase 3）。
//
// 既存の Product / HistoryEntry（types/index.ts）はDexieのnumber型
// 自動採番IDを前提にしている。Firestoreのドキュメントidはstring型のため、
// 既存型をそのまま流用せず、別の型として定義する。
// これにより既存UI・Dexie版Repository（lib/repositories/products.ts,
// history.ts）への影響をゼロに保つ。
//
// 実際にUIをFirestoreへ切り替える段階（Phase 4以降）になったら、
// Product.id / HistoryEntry.id を number → string へ一度に変更し、
// この型をそのままUI側の型として使う想定（変換シムは作らない）。
// ============================================================

export interface FirestoreProduct {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  minStock: number;
  isFavorite: boolean;
  createdAt: Date | null; // serverTimestamp()反映前は一時的にnull
  updatedAt: Date | null;
}

export type FirestoreProductInput = Omit<FirestoreProduct, "id" | "createdAt" | "updatedAt">;
export type FirestoreProductPatch = Partial<FirestoreProductInput>;

export interface FirestoreHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  action: HistoryAction;
  quantityBefore: number | null;
  quantityAfter: number | null;
  unit: string;
  actorUserId: string;
  actorDisplayName: string;
  createdAt: Date | null;
}
