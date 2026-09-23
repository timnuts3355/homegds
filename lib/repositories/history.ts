import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/db";
import type { HistoryEntry } from "@/types";

// ============================================================
// history リポジトリ
// Dexie固有の呼び出しをこのファイルに閉じ込める。
// 将来Firestoreへ差し替える際は、この関数群の中身だけを置き換える想定
// （useHistories は onSnapshot ベースの実装に差し替え、addHistory には
// 将来 actor（誰が操作したか）を渡せるよう拡張する想定）。
// ============================================================

const MAX_HISTORY = 100;

export function useHistories() {
  return useLiveQuery(
    () => getDb().histories.orderBy("createdAt").reverse().limit(100).toArray(), []
  );
}

export async function addHistory(
  entry: Omit<HistoryEntry, "id" | "createdAt">
): Promise<void> {
  const db  = getDb();
  const now = new Date();
  await db.transaction("rw", db.histories, async () => {
    await db.histories.add({ ...entry, createdAt: now });
    const count = await db.histories.count();
    if (count > MAX_HISTORY) {
      const oldest = await db.histories.orderBy("createdAt").limit(count - MAX_HISTORY).primaryKeys();
      await db.histories.bulkDelete(oldest);
    }
  });
}
