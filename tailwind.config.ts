import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",          // ← .dark クラスでダークモード切り替え
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── メインアクセント：コーラルピンク ──
        coral: {
          50:  "#fff5f4",
          100: "#ffe4e1",
          200: "#ffc9c3",
          300: "#ffa29a",
          400: "#f87068",    // タップ/アクティブ
          500: "#f2524a",    // プライマリ
          600: "#de3b33",
          700: "#ba2c25",
          800: "#9a2620",
          900: "#7f231e",
        },
        // ── サブアクセント：ラベンダー ──
        lavender: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fd",
          300: "#c4b5fc",
          400: "#a78df8",
          500: "#8b68f5",
          600: "#7a50ea",
          700: "#6a3dd0",
          800: "#5832aa",
          900: "#492b89",
        },
        // ── サブアクセント：スカイブルー ──
        sky: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // ── ニュートラル（Apple純正風グレー） ──
        base: {
          50:  "#f5f5f7",   // ページ背景（ライト）
          100: "#e8e8ed",   // リスト区切り
          200: "#d1d1d6",   // ボーダー
          300: "#aeaeb2",   // プレースホルダー
          400: "#8e8e93",   // 補足テキスト
          500: "#636366",   // セカンダリテキスト
          600: "#3a3a3c",   // プライマリテキスト（ライト）
          700: "#2c2c2e",   // 見出し（ライト）
          800: "#1c1c1e",   // ダーク背景
          900: "#000000",
        },
        // ── ダークモード用サーフェス ──
        dark: {
          bg:       "#000000",   // ページ背景
          surface:  "#1c1c1e",   // カード・リスト背景
          elevated: "#2c2c2e",   // 浮き上がりサーフェス
          border:   "#38383a",   // 区切り線
          muted:    "#48484a",   // 非アクティブ
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont",
          '"Hiragino Sans"', '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"', "sans-serif",
        ],
      },
      borderRadius: {
        ios:    "12px",
        "ios-lg": "16px",
        "ios-xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
