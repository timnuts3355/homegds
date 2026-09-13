import Header from "@/components/layout/Header";
import BackButton from "@/components/layout/BackButton";

// 統計ページ（将来実装予定 - 設定画面から開く機能として追加予定）
export default function StatsPage() {
  return (
    <>
      <Header title="統計" left={<BackButton />} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="list-group">
          <div className="flex justify-center items-center py-14">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              統計機能は今後実装予定です
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
