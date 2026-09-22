"use client";

import { useTranslations } from "next-intl";
import { unitLabel } from "@/lib/unit-label";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/db";
import { ACTION_COLORS } from "@/lib/history";
import type { HistoryEntry, HistoryAction } from "@/types";
import Header from "@/components/layout/Header";
import BackButton from "@/components/layout/BackButton";

export default function HistoryClient() {
  const t = useTranslations();
  const histories = useLiveQuery(
    () => getDb().histories.orderBy("createdAt").reverse().limit(100).toArray(), []
  ) ?? [];

  return (
    <>
      <Header title={t("nav.history")} left={<BackButton />} />
      <main className="max-w-2xl mx-auto pb-24" style={{ backgroundColor: "var(--bg)" }}>
        {histories.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="text-[11px] px-4 pt-3 pb-1" style={{ color: "var(--text-muted)" }}>
              {t("history.latest", { count: histories.length })}
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
  const t = useTranslations();
  const action  = entry.action as HistoryAction;
  const colors  = ACTION_COLORS[action];
  const label   = t(`common.${action}`);

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
              {entry.quantityBefore}{unitLabel(entry.unit, t)}
              <span className="mx-1">→</span>
              {entry.quantityAfter}{unitLabel(entry.unit, t)}
            </span>
          )}
          {entry.quantityBefore === null && entry.quantityAfter !== null && (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{entry.quantityAfter}{unitLabel(entry.unit, t)}</span>
          )}
          {entry.quantityBefore !== null && entry.quantityAfter === null && (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{entry.quantityBefore}{unitLabel(entry.unit, t)}</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>{formatDate(entry.createdAt, t)}</p>
        <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>{formatTime(entry.createdAt)}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations();
  return (
    <div className="list-group">
      <div className="flex justify-center items-center py-14">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("history.empty")}</p>
      </div>
    </div>
  );
}

function formatDate(d: Date, t: (key: string) => string): string {
  const date = new Date(d);
  const now  = new Date();
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(date, now)) return t("history.today");
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (same(date, yest)) return t("history.yesterday");
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTime(d: Date): string {
  const date = new Date(d);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
