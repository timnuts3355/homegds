"use client";

import { useLocale, useTranslations } from "next-intl";
import { unitLabel } from "@/lib/unit-label";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { getDb } from "@/db";
import { addHistory } from "@/lib/history";
import { createProductSchema, type ProductFormValues } from "@/lib/validations";
import { CATEGORIES, UNITS } from "@/lib/constants";
import BackButton from "@/components/layout/BackButton";

export default function AddProductForm() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(createProductSchema(t)),
    defaultValues: {
      name: "", category: "food", quantity: 0,
      unit: "個", minStock: 1, isFavorite: false,
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    const now = new Date();
    const id = await getDb().products.add({ ...values, createdAt: now, updatedAt: now });
    await addHistory({
      productId: id as number, productName: values.name, action: "add",
      quantityBefore: null, quantityAfter: values.quantity, unit: values.unit,
    });
    router.push(`/${locale}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* ヘッダー：Glass */}
      <header className="app-header">
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
          <BackButton />
          <h1 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>{t("product.add")}</h1>
          <div className="w-10" />
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-6">

          <FormSection label={t("product.name")} required error={errors.name?.message}>
            <input {...register("name")} type="text" placeholder={t("product.namePlaceholder")} autoFocus
              className="form-input" />
          </FormSection>

          <FormSection label={t("product.category")} required error={errors.category?.message}>
            <div className="relative">
              <select {...register("category")} className="form-input appearance-none pr-8 cursor-pointer">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{t(`categories.${c.value}`)}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }} />
            </div>
          </FormSection>

          <div className="grid grid-cols-2 gap-3">
            <FormSection label={t("product.quantity")} required error={errors.quantity?.message}>
              <input {...register("quantity")} type="number" inputMode="numeric" min={0} placeholder="0"
                className="form-input" />
            </FormSection>
            <FormSection label={t("product.unit")} required error={errors.unit?.message}>
              <div className="relative">
                <select {...register("unit")} className="form-input appearance-none pr-8 cursor-pointer">
                  {UNITS.map((u) => <option key={u} value={u}>{unitLabel(u, t)}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-muted)" }} />
              </div>
            </FormSection>
          </div>

          <FormSection label={t("product.minStock")} required error={errors.minStock?.message}
            hint={t("product.minStockHint")}>
            <input {...register("minStock")} type="number" inputMode="numeric" min={0} placeholder="1"
              className="form-input" />
          </FormSection>

        </div>

        {/* 固定フッター：Glass + グラデーションボタン */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 pb-safe"
          style={{
            backgroundColor: "var(--glass-bg)",
            backdropFilter: "blur(20px) saturate(1.8)",
            WebkitBackdropFilter: "blur(20px) saturate(1.8)",
            borderTop: "0.5px solid var(--glass-border)",
          }}>
          <div className="max-w-2xl mx-auto">
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-grad disabled:opacity-40 text-white font-semibold text-base py-3.5 rounded-ios-lg transition-opacity active:opacity-80">
              {isSubmitting ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>
      </form>
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
