import { useEffect, useState } from "react";
import {
  collection, doc, getDoc, getDocs, addDoc, onSnapshot,
  query, orderBy, limit, serverTimestamp, Timestamp,
  type DocumentData, type QueryDocumentSnapshot,
  type FirestoreError, type Unsubscribe,
} from "firebase/firestore";
import { firestore, firebaseAuth } from "@/lib/firebase/client";
import { HOUSEHOLD_ID } from "./household";
import type { FirestoreHistoryEntry } from "./types";

// ============================================================
// history の Firestore版リポジトリ（Phase 3）。
//
// パス: households/{HOUSEHOLD_ID}/history/{historyId}
// Security Rules（firestore.rules）:
//   allow read, create: if isHouseholdMember(householdId);
//   allow update, delete: if false;
// → historyは追記専用。このRepositoryもupdate/deleteは一切行わない
//   （Rules側で拒否されるため実装しても動作しない）。
//
// 【履歴保持方針（100件）】
// Dexie版は書き込み時に件数をカウントし、100件を超えたら古い履歴を
// 削除している。Firestore版では書き込み時には一切削除せず、
// 読み取り時に query(orderBy("createdAt","desc"), limit(100)) で
// 最新100件だけを取得する方式にした。
//
// 理由:
//   1) Security Rulesがhistoryのdeleteを禁止しているため、
//      書き込み時削除はそもそも実装できない（Rulesとの矛盾を避ける）。
//   2) 夫婦2人運用の書き込み頻度では、コレクションが増え続けても
//      ストレージコストは無視できるレベル。
//   3) limit(100)による取得コストはコレクションの総件数に関係なく
//      常に最大100件分の読み取りで一定のため、都度カウント集計＋削除
//      を行うメリットがない（むしろ書き込みのたびに余計な読み取り／
//      削除が発生し、無料枠の消費が増えるだけ）。
// ============================================================

const HISTORY_PATH = `households/${HOUSEHOLD_ID}/history`;
const MEMBERS_PATH  = `households/${HOUSEHOLD_ID}/members`;
const HISTORY_LIMIT = 100;

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toFirestoreHistoryEntry(snap: QueryDocumentSnapshot<DocumentData>): FirestoreHistoryEntry {
  const data = snap.data();
  return {
    id: snap.id,
    productId: data.productId,
    productName: data.productName,
    action: data.action,
    quantityBefore: data.quantityBefore,
    quantityAfter: data.quantityAfter,
    unit: data.unit,
    actorUserId: data.actorUserId,
    actorDisplayName: data.actorDisplayName,
    createdAt: toDate(data.createdAt),
  };
}

// uidごとのdisplayNameをセッション内でキャッシュし、履歴書き込みの
// たびにmembersドキュメントを読みに行かないようにする（読み取り削減）。
const displayNameCache = new Map<string, string>();

async function resolveActorDisplayName(uid: string): Promise<string> {
  const cached = displayNameCache.get(uid);
  if (cached) return cached;
  const snap = await getDoc(doc(firestore, MEMBERS_PATH, uid));
  const displayName = (snap.exists() ? (snap.data().displayName as string | undefined) : undefined) ?? uid;
  displayNameCache.set(uid, displayName);
  return displayName;
}

export async function addHistory(
  entry: Omit<FirestoreHistoryEntry, "id" | "createdAt" | "actorUserId" | "actorDisplayName">
): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) {
    throw new Error("履歴を記録するにはログインが必要です");
  }
  const actorDisplayName = await resolveActorDisplayName(uid);
  await addDoc(collection(firestore, HISTORY_PATH), {
    ...entry,
    actorUserId: uid,
    actorDisplayName,
    createdAt: serverTimestamp(),
  });
}

export async function getHistories(): Promise<FirestoreHistoryEntry[]> {
  const q = query(collection(firestore, HISTORY_PATH), orderBy("createdAt", "desc"), limit(HISTORY_LIMIT));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toFirestoreHistoryEntry);
}

/**
 * onSnapshotによるリアルタイム購読（最新100件）。
 * 読み取り専用フックのため、Firestoreが利用できない場合でも
 * 例外を投げずerrorを返すだけに留め、UIをクラッシュさせない。
 * Phase 3時点ではまだどのコンポーネントからも呼ばれていない。
 */
export function useFirestoreHistories(): {
  histories: FirestoreHistoryEntry[] | undefined;
  error: string | null;
} {
  const [histories, setHistories] = useState<FirestoreHistoryEntry[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, HISTORY_PATH), orderBy("createdAt", "desc"), limit(HISTORY_LIMIT));
    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setError(null);
        setHistories(snapshot.docs.map(toFirestoreHistoryEntry));
      },
      (err: FirestoreError) => {
        console.error("[firestore] history subscription failed", err);
        setError(err.message);
      }
    );
    return unsubscribe;
  }, []);

  return { histories, error };
}
