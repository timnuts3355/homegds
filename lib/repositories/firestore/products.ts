import { useEffect, useState } from "react";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp, Timestamp,
  type DocumentData, type QueryDocumentSnapshot, type DocumentSnapshot,
  type FirestoreError, type Unsubscribe,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import { HOUSEHOLD_ID } from "./household";
import type { FirestoreProduct, FirestoreProductInput, FirestoreProductPatch } from "./types";

// ============================================================
// products の Firestore版リポジトリ（Phase 3）。
//
// 既存の lib/repositories/products.ts（Dexie版）とは完全に独立しており、
// この時点ではどのUIコンポーネントからも呼ばれていない。
//
// パス: households/{HOUSEHOLD_ID}/products/{productId}
// Security Rules（firestore.rules）:
//   allow read, write: if isHouseholdMember(householdId);
// → households/home の memberIds に自分のUIDがある場合のみ
//   読み書き可能。ここでの実装はRulesに追加の制約を課さず、
//   単純にRead/Write APIを呼ぶだけにとどめる
//   （アクセス制御はRules側の責務として分離する）。
// ============================================================

const PRODUCTS_PATH = `households/${HOUSEHOLD_ID}/products`;

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toFirestoreProduct(
  snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): FirestoreProduct {
  const data = snap.data() as DocumentData;
  return {
    id: snap.id,
    name: data.name,
    category: data.category,
    quantity: data.quantity,
    unit: data.unit,
    minStock: data.minStock,
    isFavorite: data.isFavorite,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getProducts(): Promise<FirestoreProduct[]> {
  const snapshot = await getDocs(collection(firestore, PRODUCTS_PATH));
  return snapshot.docs.map(toFirestoreProduct);
}

export async function getProduct(id: string): Promise<FirestoreProduct | null> {
  const snap = await getDoc(doc(firestore, PRODUCTS_PATH, id));
  return snap.exists() ? toFirestoreProduct(snap) : null;
}

export async function addProduct(input: FirestoreProductInput): Promise<string> {
  const ref = await addDoc(collection(firestore, PRODUCTS_PATH), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, patch: FirestoreProductPatch): Promise<void> {
  await updateDoc(doc(firestore, PRODUCTS_PATH, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(firestore, PRODUCTS_PATH, id));
}

/**
 * onSnapshotによるリアルタイム購読（一覧）。
 * 夫が数量変更 → 妻の画面にも自動反映、という用途を想定。
 *
 * 読み取り専用フックのため、Firestoreが利用できない場合でも
 * 例外を投げずerrorを返すだけに留め、UIをクラッシュさせない。
 * Phase 3時点ではまだどのコンポーネントからも呼ばれていない。
 */
export function useFirestoreProducts(): {
  products: FirestoreProduct[] | undefined;
  error: string | null;
} {
  const [products, setProducts] = useState<FirestoreProduct[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe: Unsubscribe = onSnapshot(
      collection(firestore, PRODUCTS_PATH),
      (snapshot) => {
        setError(null);
        setProducts(snapshot.docs.map(toFirestoreProduct));
      },
      (err: FirestoreError) => {
        console.error("[firestore] products subscription failed", err);
        setError(err.message);
      }
    );
    return unsubscribe;
  }, []);

  return { products, error };
}

/** onSnapshotによるリアルタイム購読（商品1件）。 */
export function useFirestoreProduct(id: string): {
  product: FirestoreProduct | null | undefined;
  error: string | null;
} {
  const [product, setProduct] = useState<FirestoreProduct | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe: Unsubscribe = onSnapshot(
      doc(firestore, PRODUCTS_PATH, id),
      (snap) => {
        setError(null);
        setProduct(snap.exists() ? toFirestoreProduct(snap) : null);
      },
      (err: FirestoreError) => {
        console.error("[firestore] product subscription failed", err);
        setError(err.message);
      }
    );
    return unsubscribe;
  }, [id]);

  return { product, error };
}
