import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

// i18n/request.ts をデフォルトパスとして自動検出
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {},
};

const withPWAConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withNextIntl(withPWAConfig(nextConfig));
