import type { Product, Category, Unit } from "@/types";
import { CATEGORIES, UNITS } from "./constants";

// ============================================================
// CSV インポート・エクスポート ユーティリティ
// ============================================================

// CSVヘッダー（固定順）
export const CSV_HEADERS = [
  "商品名", "カテゴリ", "数量", "最低在庫", "単位", "お気に入り", "賞味期限",
] as const;

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);
const UNIT_VALUES: readonly string[] = UNITS;

// ── CSVの1セルをエスケープ（カンマ・改行・ダブルクォートを含む場合は引用符で囲む） ──
function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 商品配列をCSV文字列に変換する（UTF-8 BOM付き）
 */
export function productsToCsv(products: Product[]): string {
  const rows = [CSV_HEADERS.join(",")];

  for (const p of products) {
    const row = [
      p.name,
      p.category,
      String(p.quantity),
      String(p.minStock),
      p.unit,
      p.isFavorite ? "TRUE" : "FALSE",
      "", // 賞味期限：DB未保持のため常に空欄で出力
    ].map(escapeCsvCell);
    rows.push(row.join(","));
  }

  const csvBody = rows.join("\r\n");
  const BOM = "\uFEFF"; // Excel(Windows/Mac)・iPhoneでの文字化け防止
  return BOM + csvBody;
}

/**
 * 今日の日付からエクスポート用ファイル名を生成する
 * 例: homegds_2026-06-30.csv
 */
export function generateExportFilename(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `homegds_${y}-${m}-${d}.csv`;
}

// ============================================================
// CSVインポート
// ============================================================

export interface ParsedCsvRow {
  name: string;
  category: Category;
  quantity: number;
  minStock: number;
  unit: Unit;
  isFavorite: boolean;
  // 賞味期限は読み捨てる（DB保存対象外）
}

export interface CsvParseError {
  line: number;        // 1始まり（ヘッダー行を1とする）
  message: string;
}

export interface CsvParseResult {
  rows: ParsedCsvRow[];
  errors: CsvParseError[];
}

/**
 * CSVテキストをパースして商品データに変換する。
 * BOMの有無を問わず処理する。
 */
export function parseProductsCsv(
  text: string,
  t: (key: string, values?: Record<string, string | number>) => string
): CsvParseResult {
  // BOM除去
  const clean = text.replace(/^\uFEFF/, "");
  const lines = splitCsvLines(clean);

  const result: CsvParseResult = { rows: [], errors: [] };

  if (lines.length === 0) {
    result.errors.push({ line: 0, message: t("csv.errors.empty") });
    return result;
  }

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const expected = CSV_HEADERS as readonly string[];

  // ヘッダーの形式チェック（先頭5列は必須、賞味期限列は任意でも許容）
  const requiredHeaders = expected.slice(0, 6); // 商品名〜お気に入り
  const headerOk = requiredHeaders.every((h, i) => header[i] === h);

  if (!headerOk) {
    result.errors.push({
      line: 1,
      message: t("csv.errors.header", { columns: requiredHeaders.join(", ") }),
    });
    return result;
  }

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim() === "") continue; // 空行はスキップ

    const lineNo = i + 1; // 実ファイル上の行番号（1始まり、ヘッダー込み）
    const cells = parseCsvLine(raw);

    if (cells.length < 6) {
      result.errors.push({ line: lineNo, message: t("csv.errors.columns") });
      continue;
    }

    const [nameRaw, categoryRaw, qtyRaw, minRaw, unitRaw, favRaw] = cells;

    const name = nameRaw.trim();
    if (!name) {
      result.errors.push({ line: lineNo, message: t("csv.errors.name") });
      continue;
    }

    const category = categoryRaw.trim() as Category;
    if (!CATEGORY_VALUES.includes(category)) {
      result.errors.push({
        line: lineNo,
        message: t("csv.errors.category", { value: categoryRaw, allowed: CATEGORY_VALUES.join(", ") }),
      });
      continue;
    }

    const quantity = Number(qtyRaw.trim());
    if (qtyRaw.trim() === "" || !Number.isFinite(quantity) || quantity < 0) {
      result.errors.push({ line: lineNo, message: t("csv.errors.quantity", { value: qtyRaw }) });
      continue;
    }

    const minStock = Number(minRaw.trim());
    if (minRaw.trim() === "" || !Number.isFinite(minStock) || minStock < 0) {
      result.errors.push({ line: lineNo, message: t("csv.errors.minStock", { value: minRaw }) });
      continue;
    }

    const unit = unitRaw.trim() as Unit;
    if (!UNIT_VALUES.includes(unit)) {
      result.errors.push({
        line: lineNo,
        message: t("csv.errors.unit", { value: unitRaw, allowed: UNIT_VALUES.join(", ") }),
      });
      continue;
    }

    const favNorm = favRaw.trim().toUpperCase();
    const isFavorite = favNorm === "TRUE" || favNorm === "1" || favNorm === "YES";

    result.rows.push({ name, category, quantity, minStock, unit, isFavorite });
  }

  return result;
}

// ── 改行を考慮してCSV全体を「行」に分割する（引用符内の改行を保護） ──
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++; // CRLF対応
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.filter((l) => l.length > 0);
}

// ── 1行のCSVをセル配列にパースする ──
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cells.push(current); current = ""; }
      else current += ch;
    }
  }
  cells.push(current);
  return cells;
}
