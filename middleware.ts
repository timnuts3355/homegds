import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(ja|zh-TW)/:path*",
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
