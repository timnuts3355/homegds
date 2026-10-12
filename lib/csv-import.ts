import { getProducts, addProduct, updateProduct } from "@/lib/repositories/firestore/products";
import { addHistory } from "@/lib/repositories/firestore/history";
import type { FirestoreProduct } from "@/lib/repositories/firestore/types";
import type { ParsedCsvRow } from "./csv";

// ============================================================
// CSVインポート実行ロジック（Firestoreへ書き込み）
// ============================================================

/** 1件ごとの重複解決方法 */
export type RowDecision = "overwrite" | "skip";

export interface ImportSummary {
  added: number;
  overwritten: number;
  skipped: number;
  /** Firestoreへの書き込みに失敗した行数（その行だけ飛ばして続行する） */
  failed: number;
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
  const summary: ImportSummary = { added: 0, overwritten: 0, skipped: 0, failed: 0 };

  // 既存商品の取得に失敗した場合は重複判定ができないため、例外のまま呼び出し側へ返す
  const existing = await getProducts();
  const existingByName = new Map<string, FirestoreProduct>(existing.map((p) => [p.name, p]));

  // "以降すべて" が選ばれた後の自動適用先
  let bulkDecision: RowDecision | null = null;
  let duplicateIndex = 0;
  const totalDuplicates = countDuplicates(rows, existingByName.keys());
  let processedCount = 0;

  for (const row of rows) {
    const match = existingByName.get(row.name);

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

      // overwrite（Firestoreのstring document IDをそのまま使用）
      try {
        await updateProduct(match.id, {
          category: row.category,
          quantity: row.quantity,
          minStock: row.minStock,
          unit: row.unit,
          isFavorite: row.isFavorite,
        });
      } catch (err) {
        console.error("[firestore] csv overwrite failed", row.name, err);
        summary.failed++;
        processedCount++;
        onProgress?.(processedCount);
        continue;
      }
      // ProductEditと同じく、数量が変わった場合のみ before → after を記録する
      const quantityChanged = row.quantity !== match.quantity;
      await recordHistory({
        productId: match.id,
        productName: row.name,
        action: "edit",
        quantityBefore: quantityChanged ? match.quantity : null,
        quantityAfter: quantityChanged ? row.quantity : null,
        unit: row.unit,
      });
      existingByName.set(row.name, { ...match, ...row });
      summary.overwritten++;
    } else {
      let id: string;
      try {
        id = await addProduct({
          name: row.name,
          category: row.category,
          quantity: row.quantity,
          minStock: row.minStock,
          unit: row.unit,
          isFavorite: row.isFavorite,
        });
      } catch (err) {
        console.error("[firestore] csv add failed", row.name, err);
        summary.failed++;
        processedCount++;
        onProgress?.(processedCount);
        continue;
      }
      await recordHistory({
        productId: id,
        productName: row.name,
        action: "add",
        quantityBefore: null,
        quantityAfter: row.quantity,
        unit: row.unit,
      });
      existingByName.set(row.name, {
        id, name: row.name, category: row.category, quantity: row.quantity,
        minStock: row.minStock, unit: row.unit, isFavorite: row.isFavorite,
        createdAt: null, updatedAt: null,
      });
      summary.added++;
    }
    processedCount++;
    onProgress?.(processedCount);
  }

  return summary;
}

// 商品の書き込みは成功済みのため、履歴の記録失敗では行を失敗扱いにせず続行する
// （再インポート時の二重登録を避ける。AddProductFormと同じ方針）。
async function recordHistory(entry: Parameters<typeof addHistory>[0]): Promise<void> {
  try {
    await addHistory(entry);
  } catch (err) {
    console.error("[firestore] csv addHistory failed", entry.productName, err);
  }
}
