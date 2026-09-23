import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

const LOCALE_COOKIE = "NEXT_LOCALE";

// ルート（/）は保存済みlocale（Cookie）を見て /ja または /zh-TW へ振り分ける。
// SettingsClientがlocale切替時に同じCookieを書き込むため、次回「/」アクセス時も選択言語を維持できる。
// next-intlのmiddlewareも同名Cookieで同様のnegotiationを行うが、
// このページ自身でも明示的に判定することで挙動を保証する。
export default async function RootPage() {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = saved && routing.locales.includes(saved as "ja" | "zh-TW")
    ? saved
    : routing.defaultLocale;
  redirect(`/${locale}`);
}
