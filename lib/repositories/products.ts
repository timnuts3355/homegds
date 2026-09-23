import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/db";
import type { Product, ProductInput } from "@/types";

// ============================================================
// products リポジトリ
// Dexie固有の呼び出しをこのファイルに閉じ込める。
// 将来Firestoreへ差し替える際は、この関数群の中身だけを置き換える想定
// （useProducts/useProduct は onSnapshot ベースの実装に差し替え）。
// ============================================================

export function useProducts() {
  return useLiveQuery(() => getDb().products.toArray(), []);
}

export function useProduct(id: number) {
  return useLiveQuery(async () => (await getDb().products.get(id)) ?? null, [id]);
}

export async function getProducts(): Promise<Product[]> {
  return getDb().products.toArray();
}

export async function addProduct(input: ProductInput): Promise<number> {
  const now = new Date();
  return getDb().products.add({ ...input, createdAt: now, updatedAt: now });
}

export type ProductPatch = Partial<ProductInput>;

export async function updateProduct(id: number, patch: ProductPatch): Promise<void> {
  await getDb().products.update(id, { ...patch, updatedAt: new Date() });
}

export async function deleteProduct(id: number): Promise<void> {
  await getDb().products.delete(id);
}
