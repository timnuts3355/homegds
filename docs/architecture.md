# homegds アーキテクチャ設計メモ

## 技術スタック

| 役割 | 技術 |
|------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript 5 |
| スタイリング | Tailwind CSS 3 |
| ローカルDB | IndexedDB (Dexie.js 4) |
| フォーム | React Hook Form + Zod |
| PWA | @ducanh2912/next-pwa |
| アイコン | Lucide Icons |
| 多言語 | next-intl (ja / zh-TW) |

## ディレクトリ構成

```
homegds/
├── app/
│   ├── [locale]/          # ロケール対応ルーティング
│   │   ├── layout.tsx     # 共通レイアウト（Header + TabBar）
│   │   ├── page.tsx       # 在庫一覧
│   │   ├── history/
│   │   ├── stats/
│   │   └── settings/
│   ├── layout.tsx         # ルートレイアウト（メタデータ）
│   ├── page.tsx           # /ja へリダイレクト
│   └── globals.css
├── components/
│   └── layout/
│       ├── Header.tsx
│       └── TabBar.tsx
├── db/
│   └── index.ts           # Dexieインスタンス・テーブル定義
├── docs/
├── hooks/
│   └── useDb.ts
├── i18n/
│   ├── request.ts
│   └── routing.ts
├── lib/
│   ├── constants.ts
│   └── validations.ts
├── locales/
│   ├── ja/common.json
│   └── zh-TW/common.json
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   └── manifest.json
└── types/
    └── index.ts
```

## データモデル（IndexedDB）

### products テーブル

| フィールド | 型 | 説明 |
|------------|-----|------|
| id | number (PK, auto) | 自動採番 |
| name | string | 商品名 |
| category | Category | カテゴリ |
| quantity | number | 数量 |
| unit | Unit | 単位 |
| expiresAt | Date? | 賞味期限 |
| barcode | string? | バーコード |
| note | string? | メモ |
| createdAt | Date | 登録日時 |
| updatedAt | Date | 更新日時 |

## 多言語対応

- `ja`（日本語）: デフォルト
- `zh-TW`（繁體中文・台湾）
- ルーティング: `/ja/...`, `/zh-TW/...`
- 翻訳ファイル: `locales/{locale}/common.json`

## PWA対応

- `public/manifest.json`: ホーム画面追加メタデータ
- Service Worker: `@ducanh2912/next-pwa` が本番ビルド時に自動生成
- アイコン: 192x192, 512x512 (PNG)
