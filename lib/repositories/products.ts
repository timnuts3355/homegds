import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/db";
import type { Product, ProductInput } from "@/types";

// ============================================================
// products リポジトリ（Dexie版）
//
// Product.id はFirestore document IDを見据えてstring型（types/index.ts）。
// Dexieの実主キー（++id）は引き続きnumberのため、このファイルの境界
// でのみ Number(id) ⇄ String(id) の変換を行う。呼び出し側（UI）は
// 常にstring idだけを扱い、number|stringのunionを他所へ持ち込まない。
//
// 将来Firestoreへ差し替える際は、この関数群の中身だけを置き換える想定
// （useProducts/useProduct は onSnapshot ベースの実装に差し替え）。
// ============================================================

// DexieはT.idの型を見ずnumber主キーをそのまま返すため、
// 取得したレコードのidを実際にstring化してから返す。
function toStringId(product: Product): Product {
  return product.id === undefined ? product : { ...product, id: String(product.id) };
}

export function useProducts() {
  return useLiveQuery(async () => (await getDb().products.toArray()).map(toStringId), []);
}

export function useProduct(id: string) {
  return useLiveQuery(async () => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return null;
    const product = await getDb().products.get(numId);
    return product ? toStringId(product) : null;
  }, [id]);
}

export async function getProducts(): Promise<Product[]> {
  return (await getDb().products.toArray()).map(toStringId);
}

export async function addProduct(input: ProductInput): Promise<string> {
  const now = new Date();
  const newId = await getDb().products.add({ ...input, createdAt: now, updatedAt: now });
  return String(newId);
}

export type ProductPatch = Partial<ProductInput>;

export async function updateProduct(id: string, patch: ProductPatch): Promise<void> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return;
  await getDb().products.update(numId, { ...patch, updatedAt: new Date() });
}

export async function deleteProduct(id: string): Promise<void> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return;
  await getDb().products.delete(numId);
}
