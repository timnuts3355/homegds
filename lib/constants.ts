// ============================================================
// アプリ定数
// ============================================================

export const APP_NAME = "homegds";

export const CATEGORY_LABELS: Record<string, string> = {
  food: "食品", beverage: "飲料", daily: "日用品", medicine: "医薬品", other: "その他",
};

export const UNITS = [
  "個", "本", "袋", "箱", "缶", "枚", "g", "kg", "ml", "L", "その他",
] as const;

export const CATEGORIES = [
  { value: "food",     label: "食品"   },
  { value: "beverage", label: "飲料"   },
  { value: "daily",    label: "日用品" },
  { value: "medicine", label: "医薬品" },
  { value: "other",    label: "その他" },
] as const;

/** 在庫少ない判定：minStock の何倍まで「低め」とするか */
export const LOW_STOCK_RATIO = 2;

/** ホーム各セクションの最大表示件数 */
export const HOME_SECTION_LIMIT = 3;
