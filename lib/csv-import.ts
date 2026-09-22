import { getDb } from "@/db";
import { addHistory } from "@/lib/history";
import type { ParsedCsvRow } from "./csv";

// ============================================================
// CSVインポート実行ロジック
// ============================================================

/** 1件ごとの重複解決方法 */
export type RowDecision = "overwrite" | "skip";

export interface ImportSummary {
  added: number;
  overwritten: number;
  skipped: number;
}

/**
 * 重複行が見つかるたびに呼ばれる関数。
 * "overwrite" | "skip" のほか、"overwrite-all" | "skip-all" を返すと
 * 以降の重複行すべてに同じ決定が自動適用される。
 */
export type DuplicateResolver = (
  row: ParsedCsvRow,
  index: number,
  totalDuplicates: number
) => Promise<RowDecision | "overwrite-all" | "skip-all">;

/**
 * パース済みのCSV行をDBへ反映する。
 * - 重複行は resolveDuplicate を呼んで都度（または一括）判定する。
 * - onProgress(current) は処理済み件数が増えるたびに呼ばれる。
 */
export function countDuplicates(rows: readonly Pick<ParsedCsvRow, "name">[], existingNames: Iterable<string>): number {
  const seen = new Set(existingNames);
  let count = 0;
  for (const row of rows) {
    if (seen.has(row.name)) count++;
    seen.add(row.name);
  }
  return count;
}

export async function importProducts(
  rows: ParsedCsvRow[],
  resolveDuplicate: DuplicateResolver,
  onProgress?: (current: number) => void
): Promise<ImportSummary> {
  const db = getDb();
  const summary: ImportSummary = { added: 0, overwritten: 0, skipped: 0 };

  const existing = await db.products.toArray();
  const existingByName = new Map(existing.map((p) => [p.name, p]));

  // "以降すべて" が選ばれた後の自動適用先
  let bulkDecision: RowDecision | null = null;
  let duplicateIndex = 0;
  const totalDuplicates = countDuplicates(rows, existingByName.keys());
  let processedCount = 0;

  for (const row of rows) {
    const match = existingByName.get(row.name);
    const now = new Date();

    if (match) {
      let decision: RowDecision;

      if (bulkDecision) {
        decision = bulkDecision;
      } else {
        const result = await resolveDuplicate(row, duplicateIndex, totalDuplicates);
        if (result === "overwrite-all") {
          bulkDecision = "overwrite";
          decision = "overwrite";
        } else if (result === "skip-all") {
          bulkDecision = "skip";
          decision = "skip";
        } else {
          decision = result;
        }
      }
      duplicateIndex++;

      if (decision === "skip") {
        summary.skipped++;
        processedCount++;
        onProgress?.(processedCount);
        continue;
      }

      // overwrite
      await db.products.update(match.id!, {
        category: row.category,
        quantity: row.quantity,
        minStock: row.minStock,
        unit: row.unit,
        isFavorite: row.isFavorite,
        updatedAt: now,
      });
      await addHistory({
        productId: match.id!,
        productName: row.name,
        action: "edit",
        quantityBefore: null,
        quantityAfter: null,
        unit: row.unit,
      });
      summary.overwritten++;
    } else {
      const id = await db.products.add({
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        minStock: row.minStock,
        unit: row.unit,
        isFavorite: row.isFavorite,
        createdAt: now,
        updatedAt: now,
      });
      await addHistory({
        productId: id as number,
        productName: row.name,
        action: "add",
        quantityBefore: null,
        quantityAfter: row.quantity,
        unit: row.unit,
      });
      existingByName.set(row.name, { ...row, id: id as number, createdAt: now, updatedAt: now });
      summary.added++;
    }
    processedCount++;
    onProgress?.(processedCount);
  }

  return summary;
}
