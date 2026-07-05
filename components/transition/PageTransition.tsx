"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ============================================================
// ページ遷移アニメーション
// Apple純正アプリ風：軽いフェード＋スライド（200ms前後）
// ============================================================

// タブのルートパス（同階層間の遷移＝クロスフェード）
const TAB_ROOTS = ["/", "/inventory", "/history", "/settings"];

function cleanPath(pathname: string): string {
  return pathname.replace(/^\/(ja|zh-TW)/, "") || "/";
}

/** パスの「深さ」を返す。タブ間判定とプッシュ/ポップ方向判定に使う */
function getDepth(path: string): number {
  if (path === "/add") return 1;
  if (TAB_ROOTS.includes(path)) return 0;
  // /product/:id  → 1階層
  // /product/:id/edit → 2階層
  const segments = path.split("/").filter(Boolean);
  return segments.length;
}

type AnimKind = "cross-fade" | "push" | "pop";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path     = cleanPath(pathname);

  const prevPathRef  = useRef(path);
  const prevDepthRef = useRef(getDepth(path));

  const [displayChildren, setDisplayChildren] = useState(children);
  const [animKind, setAnimKind] = useState<AnimKind>("cross-fade");
  const [phase, setPhase]       = useState<"enter" | "idle">("idle");

  useEffect(() => {
    const prevPath  = prevPathRef.current;
    const prevDepth = prevDepthRef.current;
    if (prevPath === path) {
      // 同一パス（クエリのみ変化等）は子要素だけ更新
      setDisplayChildren(children);
      return;
    }

    const nextDepth = getDepth(path);
    const isTabSwitch = TAB_ROOTS.includes(path) && TAB_ROOTS.includes(prevPath);

    let kind: AnimKind;
    if (isTabSwitch) {
      kind = "cross-fade";
    } else if (nextDepth > prevDepth) {
      kind = "push"; // 詳細へ進む・追加画面へ進む
    } else {
      kind = "pop";  // 戻る
    }

    setAnimKind(kind);
    setPhase("enter");
    setDisplayChildren(children);

    prevPathRef.current  = path;
    prevDepthRef.current = nextDepth;

    // 次フレームでidleに戻し、CSSトランジションを発火させる
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("idle"));
    });
    return () => cancelAnimationFrame(raf);
  }, [path, children]);

  const style = getTransitionStyle(animKind, phase);

  return (
    <div style={style.wrapper}>
      <div style={style.inner}>{displayChildren}</div>
    </div>
  );
}

// ============================================================
// アニメーションスタイル定義
// ============================================================

function getTransitionStyle(kind: AnimKind, phase: "enter" | "idle") {
  const DURATION = "220ms";
  const EASING   = "cubic-bezier(0.32, 0.72, 0, 1)"; // iOS風イーズアウト

  const wrapper: React.CSSProperties = {
    minHeight: "100%",
  };

  let inner: React.CSSProperties = {
    minHeight: "100%",
    transition: `opacity ${DURATION} ${EASING}, transform ${DURATION} ${EASING}`,
    willChange: "opacity, transform",
  };

  if (kind === "cross-fade") {
    inner = {
      ...inner,
      opacity: phase === "enter" ? 0 : 1,
      transform: phase === "enter" ? "translateY(2px)" : "translateY(0)",
    };
  } else if (kind === "push") {
    // 新しい画面が右からわずかにスライドインしつつフェードイン
    inner = {
      ...inner,
      opacity: phase === "enter" ? 0 : 1,
      transform: phase === "enter" ? "translateX(12px)" : "translateX(0)",
    };
  } else {
    // pop: 戻る時は左からわずかにスライドインしつつフェードイン
    inner = {
      ...inner,
      opacity: phase === "enter" ? 0 : 1,
      transform: phase === "enter" ? "translateX(-12px)" : "translateX(0)",
    };
  }

  return { wrapper, inner };
}
