import type { Metadata } from "next";
import { Suspense } from "react";
import LocaleHistory from "@/components/layout/LocaleHistory";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/lib/firebase/AuthProvider";
import AuthGate from "@/components/auth/AuthGate";
import TabBar from "@/components/layout/TabBar";
import PageTransition from "@/components/transition/PageTransition";
import "../globals.css";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return {
    title: { absolute: `homegds - ${t("tagline")}`, template: "%s | homegds" },
    description: t("description"),
    manifest: locale === "zh-TW" ? "/manifest.zh-TW.json" : "/manifest.json",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ja" | "zh-TW")) {
    notFound();
  }

  // v4: Server Component にロケールを伝達
  setRequestLocale(locale);

  // v4: locale を明示的に渡す
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="homegds" />
        <meta name="theme-color" content="#f2524a" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            {/* v4: locale を NextIntlClientProvider に明示的に渡す */}
            <NextIntlClientProvider locale={locale} messages={messages}>
              <Suspense fallback={null}><LocaleHistory /></Suspense>
              <AuthGate>
                <PageTransition>{children}</PageTransition>
                <TabBar />
              </AuthGate>
            </NextIntlClientProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
