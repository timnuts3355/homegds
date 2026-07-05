import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // next-intlが処理するパスのマッチャー
  matcher: [
    // 国際化が必要なすべてのパス
    "/",
    "/(ja|zh-TW)/:path*",
    // next.jsの内部パスとAPIを除外
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
