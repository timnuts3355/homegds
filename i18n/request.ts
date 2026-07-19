import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale は next-intl v4 で自動的にセグメントから解決される
  let locale = await requestLocale;

  // フォールバック: 無効なロケールの場合はデフォルトを使用
  if (!locale || !routing.locales.includes(locale as "ja" | "zh-TW")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../locales/${locale}/common.json`)).default,
  };
});
