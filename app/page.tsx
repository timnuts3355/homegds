import { redirect } from "next/navigation";

// ルート（/）はmiddlewareがデフォルトロケール（/ja）へリダイレクト
// 言語設定の永続化はSettingsClientとLocalStorageで管理し、
// 初回アクセス時は/jaへ、以降はSettingsClientからrouter.pushで切り替える
export default function RootPage() {
  redirect("/ja");
}
