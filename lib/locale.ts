// ============================================================
// ロケール関連ユーティリティ
// ============================================================

const LOCALE_PATTERN = /^\/(ja|zh-TW)(?=\/|$)/;

/**
 * pathname先頭の `/ja` または `/zh-TW` を取り出す。
 * 一致しない場合は空文字を返す。
 */
export function getLocalePrefix(pathname: string): string {
  return pathname.match(LOCALE_PATTERN)?.[0] ?? "";
}
