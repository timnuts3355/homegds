import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ============================================================
// Firebase クライアント初期化
//
// NEXT_PUBLIC_* 環境変数から設定を読み込む。これらはブラウザに
// 公開される値（Web App の識別情報）であり秘密情報ではない。
// アクセス制御はこの設定値ではなく Firestore Security Rules 側で行う。
//
// Phase 1時点ではこのファイルはまだどこからも import されない
// （lib/repositories/products.ts・history.ts は引き続きDexieを使用）。
// ============================================================

const firebaseConfig: FirebaseOptions = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// HMR・複数回importでも再初期化しないようにする
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
