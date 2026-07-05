"use client";

import { useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import { getDb } from "@/db";
import { parseProductsCsv, type ParsedCsvRow, type CsvParseError } from "@/lib/csv";
import {
  importProducts,
  type RowDecision,
  type ImportSummary,
} from "@/lib/csv-import";

// ============================================================
// CSVインポート モーダル
// ステップ: ファイル選択 → 確認 → (重複行ごとの解決) → 実行 → 完了
// ============================================================

type Step = "select" | "error" | "confirm" | "resolving" | "done";

interface Props {
  onClose: () => void;
}

interface Progress {
  phase: "reading" | "importing";
  current: number;
  total: number;
}

export default function CsvImportModal({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep]               = useState<Step>("select");
  const [parsedRows, setParsedRows]   = useState<ParsedCsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<CsvParseError[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [summary, setSummary]         = useState<ImportSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]       = useState<Progress | null>(null);

  // resolving ステップ用
  const [pendingRow, setPendingRow] = useState<{
    row: ParsedCsvRow; index: number; total: number;
  } | null>(null);
  const resolverRef = useRef<((d: RowDecision | "overwrite-all" | "skip-all") => void) | null>(null);

  // ── ファイル選択 & 読み込み ──
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // フェーズ1：CSV読み込み中
    setProgress({ phase: "reading", current: 0, total: 0 });

    const text = await file.text();
    const result = parseProductsCsv(text);

    // パース完了 → 件数確定
    setProgress({ phase: "reading", current: result.rows.length, total: result.rows.length });

    if (result.rows.length === 0 && result.errors.length > 0) {
      setParseErrors(result.errors);
      setProgress(null);
      setStep("error");
      return;
    }

    setParsedRows(result.rows);
    setParseErrors(result.errors);

    const existing = await getDb().products.toArray();
    const existingNames = new Set(existing.map((p) => p.name));
    const dupCount = result.rows.filter((r) => existingNames.has(r.name)).length;
    setDuplicateCount(dupCount);

    setProgress(null);
    setStep("confirm");
  };

  // ── 重複行ごとの解決 ──
  const resolveDuplicate = (
    row: ParsedCsvRow,
    index: number,
    total: number
  ): Promise<RowDecision | "overwrite-all" | "skip-all"> => {
    setPendingRow({ row, index, total });
    setStep("resolving");
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleResolve = (decision: RowDecision | "overwrite-all" | "skip-all") => {
    resolverRef.current?.(decision);
    resolverRef.current = null;
    setPendingRow(null);
  };

  // ── インポート実行 ──
  const handleImport = async () => {
    setIsProcessing(true);

    // フェーズ2：インポート中 — importProducts にプログレスコールバックを注入
    const total = parsedRows.length;
    setProgress({ phase: "importing", current: 0, total });

    const result = await importProducts(
      parsedRows,
      resolveDuplicate,
      (current) => setProgress({ phase: "importing", current, total })
    );

    setSummary(result);
    setIsProcessing(false);
    setProgress(null);
    setStep("done");
  };

  const handlePickFile = () => fileInputRef.current?.click();

  // ── 進捗バー共通コンポーネント ──
  const ProgressBar = ({ current, total }: { current: number; total: number }) => {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
      <div className="w-full">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
          <div
            className="h-full rounded-full bg-grad transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const isBusy = isProcessing || step === "resolving" || !!progress;

  return (
    <div
      className="modal-overlay flex items-center justify-center px-6"
      onClick={isBusy ? undefined : onClose}
      onKeyDown={(e) => { if (e.key === "Escape" && !isBusy) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="CSVインポート"
    >
      <div className="w-full max-w-sm modal-sheet" onClick={(e) => e.stopPropagation()}>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "0.5px solid var(--glass-border)" }}>
          <p className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
            CSVインポート
          </p>
          {/* 完了ステップ以外・処理中以外では × を表示しない */}
          {step === "select" && (
            <button onClick={onClose} aria-label="閉じる" className="p-1 -m-1">
              <X size={18} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>

        <div className="px-5 py-5">

          {/* ── ステップ1: ファイル選択 ── */}
          {step === "select" && !progress && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-grad-soft">
                <Upload size={22} style={{ color: "var(--accent)" }} strokeWidth={1.8} />
              </div>
              <p className="text-[13px] text-center leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                CSVファイルを選択してください。<br />
                商品名・カテゴリ・数量・最低在庫・単位・お気に入りの列が必要です。
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handlePickFile}
                className="w-full bg-grad text-white font-semibold text-[15px] py-3 rounded-ios-lg transition-opacity active:opacity-80"
              >
                ファイルを選択
              </button>
            </div>
          )}

          {/* ── 進捗表示（読み込み中 / インポート中） ── */}
          {progress && (
            <div className="flex flex-col gap-4 py-4">
              <div>
                <p className="text-[14px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {progress.phase === "reading"
                    ? "CSV読み込み中…"
                    : "インポート中…"
                  }
                </p>
                <p className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {progress.current} / {progress.total > 0 ? progress.total : "…"} 件
                </p>
              </div>
              <ProgressBar current={progress.current} total={progress.total} />
            </div>
          )}

          {/* ── ステップ: エラー（致命的） ── */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <AlertCircle size={28} style={{ color: "#f2524a" }} strokeWidth={1.8} />
              <p className="text-[14px] font-semibold text-center" style={{ color: "var(--text-primary)" }}>
                CSVを読み込めませんでした
              </p>
              <div className="w-full max-h-40 overflow-y-auto rounded-ios"
                style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-[12px] px-3 py-2" style={{ color: "#f2524a" }}>
                    {err.line > 0 ? `${err.line}行目: ` : ""}{err.message}
                  </p>
                ))}
              </div>
              <button
                onClick={() => setStep("select")}
                className="w-full mt-1 py-3 rounded-ios-lg text-[15px] font-semibold transition-opacity active:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                別のファイルを選び直す
              </button>
            </div>
          )}

          {/* ── ステップ2: 確認 ── */}
          {step === "confirm" && !progress && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} style={{ color: "var(--accent)" }} />
                <p className="text-[14px]" style={{ color: "var(--text-primary)" }}>
                  {parsedRows.length}件の商品データを読み込みました
                </p>
              </div>

              {parseErrors.length > 0 && (
                <div className="rounded-ios px-3 py-2"
                  style={{ backgroundColor: "rgba(242,82,74,0.08)", border: "1px solid rgba(242,82,74,0.25)" }}>
                  <p className="text-[12px] font-semibold mb-1" style={{ color: "#f2524a" }}>
                    {parseErrors.length}件のエラー行はスキップされます
                  </p>
                  <div className="max-h-20 overflow-y-auto space-y-0.5">
                    {parseErrors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-[11px]" style={{ color: "#de3b33" }}>
                        {err.line}行目: {err.message}
                      </p>
                    ))}
                    {parseErrors.length > 5 && (
                      <p className="text-[11px]" style={{ color: "#de3b33" }}>
                        他 {parseErrors.length - 5}件…
                      </p>
                    )}
                  </div>
                </div>
              )}

              {duplicateCount > 0 && (
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  同名の商品が{duplicateCount}件あります。1件ずつ処理方法を確認します。
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 py-3 rounded-ios-lg text-[15px] font-medium transition-opacity active:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing || parsedRows.length === 0}
                  className="flex-1 bg-grad disabled:opacity-40 text-white font-semibold text-[15px] py-3 rounded-ios-lg transition-opacity active:opacity-80"
                >
                  インポート
                </button>
              </div>
            </div>
          )}

          {/* ── ステップ: 重複行ごとの解決 ── */}
          {step === "resolving" && !pendingRow && (
            <div className="flex flex-col items-center gap-2 py-8">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>処理中…</p>
            </div>
          )}
          {step === "resolving" && pendingRow && (
            <div className="flex flex-col gap-4">
              {/* 進捗サブテキスト */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                    重複確認中…
                  </p>
                  <p className="text-[12px] tabular-nums font-semibold" style={{ color: "var(--accent)" }}>
                    {pendingRow.index + 1} / {pendingRow.total} 件
                  </p>
                </div>
                <ProgressBar current={pendingRow.index + 1} total={pendingRow.total} />
              </div>

              <div>
                <p className="text-[15px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                  「{pendingRow.row.name}」は既に登録されています
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  この商品をどう処理しますか？
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <ResolveButton label="この商品だけ上書き" onClick={() => handleResolve("overwrite")} primary />
                <ResolveButton label="この商品だけスキップ" onClick={() => handleResolve("skip")} />
                <div className="h-px my-0.5" style={{ backgroundColor: "var(--border-soft)" }} />
                <ResolveButton label="以降すべて上書き" onClick={() => handleResolve("overwrite-all")} />
                <ResolveButton label="以降すべてスキップ" onClick={() => handleResolve("skip-all")} />
              </div>
            </div>
          )}

          {/* ── ステップ3: 完了 ── */}
          {step === "done" && summary && (
            <div className="flex flex-col gap-4 py-1">
              <div className="flex flex-col items-center gap-2 pt-1">
                <CheckCircle2 size={32} style={{ color: "var(--accent)" }} strokeWidth={1.5} />
                <p className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  インポートが完了しました
                </p>
              </div>

              {/* 結果サマリー */}
              <div
                className="rounded-ios-lg overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                <SummaryRow
                  label="新規追加"
                  count={summary.added}
                  accent={summary.added > 0 ? "var(--accent)" : undefined}
                  isLast={false}
                />
                <SummaryRow
                  label="上書き"
                  count={summary.overwritten}
                  accent={summary.overwritten > 0 ? "#9b87e0" : undefined}
                  isLast={false}
                />
                <SummaryRow
                  label="スキップ"
                  count={summary.skipped}
                  isLast={parseErrors.length === 0}
                />
                {parseErrors.length > 0 && (
                  <SummaryRow
                    label="エラー（スキップ）"
                    count={parseErrors.length}
                    accent={parseErrors.length > 0 ? "#f2524a" : undefined}
                    isLast
                  />
                )}
              </div>

              {/* 閉じるボタン（完了後のみ表示） */}
              <button
                onClick={onClose}
                className="w-full bg-grad text-white font-semibold text-[15px] py-3.5 rounded-ios-lg transition-opacity active:opacity-80"
              >
                閉じる
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ResolveButton({
  label, onClick, primary,
}: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-2.5 rounded-ios-lg text-[14px] font-semibold transition-opacity active:opacity-70 ${primary ? "bg-grad text-white" : ""}`}
      style={
        primary
          ? {}
          : { backgroundColor: "var(--surface-alt)", color: "var(--text-primary)", border: "1px solid var(--border)" }
      }
    >
      {label}
    </button>
  );
}

function SummaryRow({
  label, count, accent, isLast,
}: { label: string; count: number; accent?: string; isLast: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: isLast ? "none" : "1px solid var(--border-soft)" }}
    >
      <span className="text-[14px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span
        className="text-[15px] font-bold tabular-nums"
        style={{ color: accent ?? "var(--text-muted)" }}
      >
        {count}件
      </span>
    </div>
  );
}
