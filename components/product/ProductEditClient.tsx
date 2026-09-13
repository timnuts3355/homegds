"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, Trash2, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getDb } from "@/db";
import { addHistory } from "@/lib/history";
import { CATEGORIES, UNITS } from "@/lib/constants";
import Header from "@/components/layout/Header";
import BackButton from "@/components/layout/BackButton";

const editSchema = z.object({
  name:       z.string().min(1, "商品名を入力してください").max(100),
  category:   z.enum(["food", "beverage", "daily", "medicine", "other"]),
  unit:       z.enum(["個", "本", "袋", "箱", "缶", "枚", "g", "kg", "ml", "L", "その他"]),
  minStock:   z.coerce.number().min(0).max(99999),
  isFavorite: z.boolean(),
});
type EditFormValues = z.infer<typeof editSchema>;

interface Props { id: number; }

export default function ProductEditClient({ id }: Props) {
  const router  = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const product = useLiveQuery(() => getDb().products.get(id), [id]);

  const { register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting, isDirty } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (!product) return;
    reset({ name: product.name, category: product.category,
      unit: product.unit, minStock: product.minStock, isFavorite: product.isFavorite });
  }, [product, reset]);

  const isFavorite = watch("isFavorite");

  const onSubmit = useCallback(async (values: EditFormValues) => {
    if (!product?.id) return;
    await getDb().products.update(product.id, { ...values, updatedAt: new Date() });
    await addHistory({
      productId: product.id, productName: values.name, action: "edit",
      quantityBefore: null, quantityAfter: null, unit: values.unit,
    });
    router.back();
  }, [product, router]);

  const handleDelete = useCallback(async () => {
    if (!product?.id) return;
    await addHistory({
      productId: product.id, productName: product.name, action: "delete",
      quantityBefore: product.quantity, quantityAfter: null, unit: product.unit,
    });
    await getDb().products.delete(product.id);
    router.push("/inventory");
  }, [product, router]);

  if (product === undefined) return (
    <><Header title="" left={<BackButton />} /><div className="flex justify-center pt-20"><p className="text-sm" style={{ color: "var(--text-muted)" }}>読み込み中…</p></div></>
  );
  if (product === null) return (
    <><Header title="編集" left={<BackButton />} /><div className="flex justify-center pt-20"><p className="text-sm" style={{ color: "var(--text-muted)" }}>商品が見つかりません</p></div></>
  );

  return (
    <>
      <Header title="編集" left={<BackButton />} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-36 space-y-5">
          <FormSection label="商品名" required error={errors.name?.message}>
            <input {...register("name")} type="text" className="form-input" />
          </FormSection>
          <FormSection label="カテゴリ" required>
            <div className="relative">
              <select {...register("category")} className="form-input appearance-none pr-9 cursor-pointer">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }} />
            </div>
          </FormSection>
          <FormSection label="単位" required>
            <div className="relative">
              <select {...register("unit")} className="form-input appearance-none pr-9 cursor-pointer">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }} />
            </div>
          </FormSection>
          <FormSection label="最低在庫" required error={errors.minStock?.message}
            hint="この数を下回ると補充が必要と表示されます">
            <input {...register("minStock")} type="number" inputMode="numeric" min={0}
              className="form-input" />
          </FormSection>

          {/* お気に入りトグル：シンプルリスト行（グラデーション★） */}
          <div className="list-group -mx-4">
            <button type="button" onClick={() => setValue("isFavorite", !isFavorite, { shouldDirty: true })}
              className="list-row w-full justify-between">
              <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>お気に入り</span>
              {isFavorite ? (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="starGradEdit" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f2524a" />
                      <stop offset="55%" stopColor="#b8a9e8" />
                      <stop offset="100%" stopColor="#89c4e1" />
                    </linearGradient>
                  </defs>
                  <polygon fill="url(#starGradEdit)"
                    points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ) : (
                <Star size={20} strokeWidth={1.8} style={{ color: "var(--border)" }} />
              )}
            </button>
          </div>
        </div>

        {/* 固定フッター：Glass */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 pb-safe"
          style={{
            backgroundColor: "var(--glass-bg)",
            backdropFilter: "blur(20px) saturate(1.8)",
            WebkitBackdropFilter: "blur(20px) saturate(1.8)",
            borderTop: "0.5px solid var(--glass-border)",
          }}>
          <div className="max-w-2xl mx-auto space-y-2">
            <button type="submit" disabled={isSubmitting || !isDirty}
              className="w-full bg-grad disabled:opacity-40 text-white font-semibold text-base py-3.5 rounded-ios-lg transition-opacity active:opacity-80">
              {isSubmitting ? "保存中…" : "変更を保存"}
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-ios-lg transition-opacity active:opacity-70"
              style={{ border: "1px solid rgba(242,82,74,0.35)" }}>
              <Trash2 size={16} style={{ color: "#f2524a" }} strokeWidth={1.8} />
              <span className="text-[15px] font-medium" style={{ color: "#f2524a" }}>この商品を削除</span>
            </button>
          </div>
        </div>
      </form>

      {showDeleteConfirm && (
        <DeleteDialog productName={product.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)} />
      )}
    </>
  );
}

function DeleteDialog({ productName, onConfirm, onCancel }: {
  productName: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="modal-overlay flex items-center justify-center px-6">
      <div className="w-full max-w-xs modal-sheet">
        <div className="px-5 pt-5 pb-3 text-center">
          <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>商品を削除</p>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            「{productName}」を削除しますか？<br />この操作は取り消せません。
          </p>
        </div>
        <div className="flex" style={{ borderTop: "0.5px solid var(--glass-border)" }}>
          <button onClick={onCancel}
            className="flex-1 py-3.5 text-[16px] font-medium active:opacity-70 transition-opacity"
            style={{ color: "var(--text-primary)", borderRight: "0.5px solid var(--glass-border)" }}>
            キャンセル
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3.5 text-[16px] font-semibold active:opacity-70 transition-opacity"
            style={{ color: "#f2524a" }}>
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

function FormSection({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}{required && <span style={{ color: "#f2524a" }} className="ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
      {error         && <p className="text-xs" style={{ color: "#f2524a" }}>{error}</p>}
    </div>
  );
}
