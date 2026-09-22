import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/layout/Header";
import BackButton from "@/components/layout/BackButton";

// 統計ページ（将来実装予定 - 設定画面から開く機能として追加予定）
export default async function StatsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "stats" });
  return (
    <>
      <Header title={t("title")} left={<BackButton />} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="list-group">
          <div className="flex justify-center items-center py-14">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("comingSoon")}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
