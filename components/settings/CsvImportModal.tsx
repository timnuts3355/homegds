"use client";

import { useTranslations } from "next-intl";

import { useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import { getDb } from "@/db";
import { parseProductsCsv, type ParsedCsvRow, type CsvParseError } from "@/lib/csv";
import {
  importProducts,
  countDuplicates,
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
  const t = useTranslations();
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
    const result = parseProductsCsv(text, t);

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
    const dupCount = countDuplicates(result.rows, existingNames);
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
      aria-label={t("settings.import")}
    >
      <div className="w-full max-w-sm modal-sheet" onClick={(e) => e.stopPropagation()}>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "0.5px solid var(--glass-border)" }}>
          <p className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("settings.import")}
          </p>
          {/* 完了ステップ以外・処理中以外では × を表示しない */}
          {step === "select" && (
            <button onClick={onClose} aria-label={t("common.close")} className="p-1 -m-1">
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
                {t("csv.selectHint")}<br />
                {t("csv.columnsHint")}
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
                {t("csv.selectFile")}
              </button>
            </div>
          )}

          {/* ── 進捗表示（読み込み中 / インポート中） ── */}
          {progress && (
            <div className="flex flex-col gap-4 py-4">
              <div>
                <p className="text-[14px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {progress.phase === "reading"
                    ? t("csv.reading")
                    : t("csv.importing")
                  }
                </p>
                <p className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {t("csv.progress", { current: progress.current, total: progress.total > 0 ? progress.total : "…" })}
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
                {t("csv.readFailed")}
              </p>
              <div className="w-full max-h-40 overflow-y-auto rounded-ios"
                style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-[12px] px-3 py-2" style={{ color: "#f2524a" }}>
                    {err.line > 0 ? t("csv.line", { line: err.line, message: err.message }) : err.message}
                  </p>
                ))}
              </div>
              <button
                onClick={() => setStep("select")}
                className="w-full mt-1 py-3 rounded-ios-lg text-[15px] font-semibold transition-opacity active:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                {t("csv.retry")}
              </button>
            </div>
          )}

          {/* ── ステップ2: 確認 ── */}
          {step === "confirm" && !progress && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} style={{ color: "var(--accent)" }} />
                <p className="text-[14px]" style={{ color: "var(--text-primary)" }}>
                  {t("csv.loaded", { count: parsedRows.length })}
                </p>
              </div>

              {parseErrors.length > 0 && (
                <div className="rounded-ios px-3 py-2"
                  style={{ backgroundColor: "rgba(242,82,74,0.08)", border: "1px solid rgba(242,82,74,0.25)" }}>
                  <p className="text-[12px] font-semibold mb-1" style={{ color: "#f2524a" }}>
                    {t("csv.skippedErrors", { count: parseErrors.length })}
                  </p>
                  <div className="max-h-20 overflow-y-auto space-y-0.5">
                    {parseErrors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-[11px]" style={{ color: "#de3b33" }}>
                        {t("csv.line", { line: err.line, message: err.message })}
                      </p>
                    ))}
                    {parseErrors.length > 5 && (
                      <p className="text-[11px]" style={{ color: "#de3b33" }}>
                        {t("csv.more", { count: parseErrors.length - 5 })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {duplicateCount > 0 && (
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  {t("csv.duplicates", { count: duplicateCount })}
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 py-3 rounded-ios-lg text-[15px] font-medium transition-opacity active:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing || parsedRows.length === 0}
                  className="flex-1 bg-grad disabled:opacity-40 text-white font-semibold text-[15px] py-3 rounded-ios-lg transition-opacity active:opacity-80"
                >
                  {t("csv.importAction")}
                </button>
              </div>
            </div>
          )}

          {/* ── ステップ: 重複行ごとの解決 ── */}
          {step === "resolving" && !pendingRow && (
            <div className="flex flex-col items-center gap-2 py-8">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{t("common.processing")}</p>
            </div>
          )}
          {step === "resolving" && pendingRow && (
            <div className="flex flex-col gap-4">
              {/* 進捗サブテキスト */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {t("csv.checkingDuplicates")}
                  </p>
                  <p className="text-[12px] tabular-nums font-semibold" style={{ color: "var(--accent)" }}>
                    {t("csv.progress", { current: pendingRow.index + 1, total: pendingRow.total })}
                  </p>
                </div>
                <ProgressBar current={pendingRow.index + 1} total={pendingRow.total} />
              </div>

              <div>
                <p className="text-[15px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {t("csv.exists", { name: pendingRow.row.name })}
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {t("csv.resolve")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <ResolveButton label={t("csv.overwriteOne")} onClick={() => handleResolve("overwrite")} primary />
                <ResolveButton label={t("csv.skipOne")} onClick={() => handleResolve("skip")} />
                <div className="h-px my-0.5" style={{ backgroundColor: "var(--border-soft)" }} />
                <ResolveButton label={t("csv.overwriteAll")} onClick={() => handleResolve("overwrite-all")} />
                <ResolveButton label={t("csv.skipAll")} onClick={() => handleResolve("skip-all")} />
              </div>
            </div>
          )}

          {/* ── ステップ3: 完了 ── */}
          {step === "done" && summary && (
            <div className="flex flex-col gap-4 py-1">
              <div className="flex flex-col items-center gap-2 pt-1">
                <CheckCircle2 size={32} style={{ color: "var(--accent)" }} strokeWidth={1.5} />
                <p className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  {t("csv.done")}
                </p>
              </div>

              {/* 結果サマリー */}
              <div
                className="rounded-ios-lg overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                <SummaryRow
                  label={t("csv.added")}
                  count={summary.added}
                  accent={summary.added > 0 ? "var(--accent)" : undefined}
                  isLast={false}
                />
                <SummaryRow
                  label={t("csv.overwritten")}
                  count={summary.overwritten}
                  accent={summary.overwritten > 0 ? "#9b87e0" : undefined}
                  isLast={false}
                />
                <SummaryRow
                  label={t("csv.skipped")}
                  count={summary.skipped}
                  isLast={parseErrors.length === 0}
                />
                {parseErrors.length > 0 && (
                  <SummaryRow
                    label={t("csv.errorsSkipped")}
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
                {t("common.close")}
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
  const t = useTranslations();
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
        {t("csv.count", { count })}
      </span>
    </div>
  );
}
