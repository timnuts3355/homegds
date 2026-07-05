import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "商品名を入力してください").max(100),
  category: z.enum(["food", "beverage", "daily", "medicine", "other"], {
    required_error: "カテゴリを選択してください",
  }),
  quantity: z.coerce.number({ invalid_type_error: "数量を入力してください" })
    .min(0).max(99999),
  unit: z.enum(["個", "本", "袋", "箱", "缶", "枚", "g", "kg", "ml", "L", "その他"], {
    required_error: "単位を選択してください",
  }),
  minStock: z.coerce.number({ invalid_type_error: "最低在庫を入力してください" })
    .min(0).max(99999),
  isFavorite: z.boolean().default(false),
});

export type ProductFormValues = z.infer<typeof productSchema>;
