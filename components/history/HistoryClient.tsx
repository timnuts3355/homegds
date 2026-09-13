"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/db";
import { ACTION_LABELS, ACTION_COLORS } from "@/lib/history";
import type { HistoryEntry, HistoryAction } from "@/types";
import Header from "@/components/layout/Header";
import BackButton from "@/components/layout/BackButton";

export default function HistoryClient() {
  const histories = useLiveQuery(
    () => getDb().histories.orderBy("createdAt").reverse().limit(100).toArray(), []
  ) ?? [];

  return (
    <>
      <Header title="履歴" left={<BackButton />} />
      <main className="max-w-2xl mx-auto pb-24" style={{ backgroundColor: "var(--bg)" }}>
        {histories.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="text-[11px] px-4 pt-3 pb-1" style={{ color: "var(--text-muted)" }}>
              最新 {histories.length} 件
            </p>
            <div className="list-group">
              {histories.map((entry, index) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  isLast={index === histories.length - 1}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function HistoryRow({ entry, isLast }: { entry: HistoryEntry; isLast: boolean }) {
  const action  = entry.action as HistoryAction;
  const colors  = ACTION_COLORS[action];
  const label   = ACTION_LABELS[action];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: isLast ? "none" : "1px solid var(--border-soft)" }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.dot, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate leading-snug" style={{ color: "var(--text-primary)" }}>
          {entry.productName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] font-semibold" style={{ color: colors.text }}>{label}</span>
          {entry.quantityBefore !== null && entry.quantityAfter !== null && (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {entry.quantityBefore}{entry.unit}
              <span className="mx-1">→</span>
              {entry.quantityAfter}{entry.unit}
            </span>
          )}
          {entry.quantityBefore === null && entry.quantityAfter !== null && (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{entry.quantityAfter}{entry.unit}</span>
          )}
          {entry.quantityBefore !== null && entry.quantityAfter === null && (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{entry.quantityBefore}{entry.unit}</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>{formatDate(entry.createdAt)}</p>
        <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>{formatTime(entry.createdAt)}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="list-group">
      <div className="flex justify-center items-center py-14">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>履歴がありません</p>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  const date = new Date(d);
  const now  = new Date();
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(date, now)) return "今日";
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (same(date, yest)) return "昨日";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTime(d: Date): string {
  const date = new Date(d);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
