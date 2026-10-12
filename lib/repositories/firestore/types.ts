import type { Category, Unit, HistoryAction } from "@/types";

// ============================================================
// Firestoreのデータ型。各画面はこの型をそのまま使用する。
//
// ドキュメントidはstring。createdAt / updatedAt は serverTimestamp() で
// 付与されるため、サーバー反映前の一時的な状態ではnullになる。
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
