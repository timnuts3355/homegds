import type { HistoryAction } from "@/types";

export { addHistory, useHistories } from "@/lib/repositories/history";

export const ACTION_LABELS: Record<HistoryAction, string> = {
  add: "追加", use: "使用", restock: "補充", edit: "編集", delete: "削除",
};

// 新パレット対応: coral / lavender / skyblue
export const ACTION_COLORS: Record<HistoryAction, { dot: string; text: string }> = {
  add:     { dot: "#89c4e1", text: "#5baed4" },   // スカイブルー
  use:     { dot: "#f2524a", text: "#de3b33" },   // コーラル
  restock: { dot: "#b8a9e8", text: "#9b87e0" },   // ラベンダー
  edit:    { dot: "#8e8e93", text: "#636366" },   // グレー
  delete:  { dot: "#aeaeb2", text: "#8e8e93" },   // ライトグレー
};
