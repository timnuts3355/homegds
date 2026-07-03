# homegds v1.0.0

**家庭用在庫管理 PWA**

食材・日用品の在庫をスマートフォンで手軽に管理するプログレッシブウェブアプリです。  
すべてのデータはデバイスのローカル（IndexedDB）に保存されます。サーバーへの送信は一切行いません。

---

## アプリ概要

| 項目 | 内容 |
|---|---|
| アプリ名 | homegds |
| バージョン | 1.0.0 |
| 対応言語 | 日本語 / 繁體中文（台湾） |
| データ保存先 | ブラウザ内 IndexedDB（オフライン対応） |
| 対応環境 | モダンブラウザ全般・iPhone Safari（PWAとして利用可能） |

---

## セットアップ方法

### 前提条件

- **Node.js** 18.17.0 以上（推奨: 22.x）
- **npm** 9.0.0 以上

```bash
node --version   # v18以上を確認
npm --version    # v9以上を確認
```

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/homegds.git
cd homegds

# 依存パッケージをインストール
npm install
```

---

## 起動方法

### 開発サーバー

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

> **Note:** 開発環境では Service Worker（PWA機能・オフラインキャッシュ）は無効です。

### 本番ビルド

```bash
# ビルド（Service Worker が生成されます）
npm run build

# 起動
npm start
```

### コード品質チェック

```bash
npm run lint
```

---

## デプロイ（Vercel 推奨）

```bash
# Git 初期化とプッシュ
git init
git add .
git commit -m "feat: v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/homegds.git
git push -u origin main
```

[Vercel](https://vercel.com) で GitHub リポジトリをインポートするだけでデプロイ完了です。  
デプロイ後の URL でモバイルブラウザから「ホーム画面に追加」すると PWA として利用できます。

---

## 技術構成

| 役割 | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 15.3.3 |
| 言語 | TypeScript | ^5 |
| スタイリング | Tailwind CSS | ^3.4 |
| ローカル DB | IndexedDB (Dexie.js) | ^4.0 |
| フォーム | React Hook Form + Zod | ^7 / ^3 |
| PWA | @ducanh2912/next-pwa | ^10.2 |
| アイコン | Lucide React | ^0.511 |
| 多言語 | next-intl | ^4.1 |

---

## ディレクトリ構成

```
homegds/
├── app/
│   ├── [locale]/              # ロケール対応ルーティング（ja / zh-TW）
│   │   ├── layout.tsx         # 共通レイアウト（ThemeProvider + TabBar）
│   │   ├── page.tsx           # ホーム画面
│   │   ├── add/page.tsx       # 商品追加
│   │   ├── inventory/page.tsx # 在庫一覧
│   │   ├── history/page.tsx   # 履歴
│   │   ├── settings/page.tsx  # 設定
│   │   └── product/[id]/      # 商品詳細・編集
│   ├── layout.tsx             # ルートレイアウト（メタデータ・Viewport）
│   ├── page.tsx               # / → /ja リダイレクト
│   └── globals.css            # グローバルスタイル・CSS変数・Glassクラス
│
├── components/
│   ├── home/                  # ホーム画面コンポーネント
│   │   ├── HomeClient.tsx
│   │   └── StockSection.tsx
│   ├── history/               # 履歴画面
│   │   └── HistoryClient.tsx
│   ├── inventory/             # 在庫一覧（スワイプ・長押し・検索）
│   │   └── InventoryClient.tsx
│   ├── layout/                # 共通 UI
│   │   ├── Header.tsx         # Glass ヘッダー
│   │   └── TabBar.tsx         # Glass タブバー（グラデーションアクティブ）
│   ├── product/               # 商品詳細・追加・編集
│   │   ├── AddProductForm.tsx
│   │   ├── ProductDetailClient.tsx
│   │   └── ProductEditClient.tsx
│   ├── providers/
│   │   └── ThemeProvider.tsx  # ダークモード Context
│   ├── settings/              # 設定画面・CSV インポートモーダル
│   │   ├── SettingsClient.tsx
│   │   └── CsvImportModal.tsx
│   └── transition/
│       └── PageTransition.tsx # ページ遷移アニメーション
│
├── db/
│   └── index.ts               # Dexie DB 定義（v1〜v4 マイグレーション）
│
├── docs/
│   ├── architecture.md        # 設計ドキュメント
│   ├── RELEASE_NOTE_v1.0.0.md
│   └── CHECKLIST_v1.0.0.md
│
├── hooks/                     # カスタムフック（現在空）
│
├── i18n/
│   ├── routing.ts             # next-intl ルーティング設定
│   └── request.ts             # next-intl サーバーリクエスト設定
│
├── lib/
│   ├── constants.ts           # アプリ定数（カテゴリ・単位・ラベル等）
│   ├── csv.ts                 # CSV 変換・パースユーティリティ
│   ├── csv-import.ts          # CSV インポート実行ロジック
│   ├── history.ts             # 履歴追記ユーティリティ
│   ├── stock.ts               # 在庫ステータス判定・ソート・数量ステップ
│   └── validations.ts         # Zod バリデーションスキーマ
│
├── locales/
│   ├── ja/common.json         # 日本語翻訳
│   └── zh-TW/common.json      # 繁體中文翻訳
│
├── middleware.ts              # next-intl ロケールミドルウェア
│
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png   # PWA アイコン
│   │   └── icon-512x512.png
│   └── manifest.json          # Web App Manifest
│
└── types/
    └── index.ts               # TypeScript 型定義
```

---

## CSV 仕様

### エクスポート形式

| 列 | 内容 | 例 |
|---|---|---|
| 商品名 | 商品名 | 醤油 |
| カテゴリ | カテゴリ識別子 | `food` |
| 数量 | 現在の在庫数量 | 2 |
| 最低在庫 | 最低在庫数 | 1 |
| 単位 | 単位 | 本 |
| お気に入り | TRUE / FALSE | FALSE |
| 賞味期限 | 常に空欄（v1.0.0では未対応） | |

**エンコーディング:** UTF-8 BOM付き（Excel・iPhone で文字化けなし）  
**改行コード:** CRLF (`\r\n`)  
**ファイル名:** `homegds_YYYY-MM-DD.csv`

### カテゴリ識別子

| 識別子 | 日本語 | 繁體中文 |
|---|---|---|
| `food` | 食品 | 食品 |
| `beverage` | 飲料 | 飲料 |
| `daily` | 日用品 | 日用品 |
| `medicine` | 医薬品 | 醫藥品 |
| `other` | その他 | 其他 |

### 単位一覧

`個` / `本` / `袋` / `箱` / `缶` / `枚` / `g` / `kg` / `ml` / `L` / `その他`

---

## 多言語対応

| 言語 | URL プレフィックス | ロケールコード |
|---|---|---|
| 日本語（デフォルト） | `/ja/...` | `ja` |
| 繁體中文（台湾） | `/zh-TW/...` | `zh-TW` |

- 設定画面から切替可能。選択した言語は `localStorage` に保存され、次回起動時も維持されます。
- システム言語には追従しません（初回起動は常に日本語）。
- 翻訳ファイル: `locales/{locale}/common.json`

---

## PWA について

### ホーム画面への追加

1. iPhone Safari でデプロイ済みの URL を開く
2. 画面下部の「共有」アイコンをタップ
3. 「ホーム画面に追加」を選択

### Service Worker

- 開発環境（`npm run dev`）では Service Worker は無効です。
- 本番ビルド（`npm run build && npm start`）後に有効化され、オフラインでも基本操作が可能になります。

### アイコン

`public/icons/` 内の PNG は自動生成されたプレースホルダーです。  
本番リリース前には正式なデザインデータへの差し替えを推奨します。

---

## データについて

- すべてのデータはブラウザの IndexedDB に保存されます。
- サーバーへのデータ送信は一切行いません。
- ブラウザのデータをクリアすると、登録済みデータはすべて削除されます。
- 大切なデータは定期的に「設定 → CSVエクスポート」でバックアップしてください。

---

## ライセンス

Private — All rights reserved.

---

*homegds v1.0.0 — Built with Next.js, TypeScript, Tailwind CSS, Dexie.js*
