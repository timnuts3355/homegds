import { z } from "zod";
import { UNITS } from "./constants";

type Translate = (key: string) => string;

export function createProductSchema(t: Translate) {
  const number = (key: string) => z.coerce.number({ invalid_type_error: t(key) })
    .min(0, t("validation.range")).max(99999, t("validation.range"));
  return z.object({
    name: z.string().min(1, t("validation.nameRequired")).max(100, t("validation.nameMax")),
    category: z.enum(["food", "beverage", "daily", "medicine", "other"], {
      errorMap: () => ({ message: t("validation.category") }),
    }),
    quantity: number("validation.quantity"),
    unit: z.enum(UNITS, { errorMap: () => ({ message: t("validation.unit") }) }),
    minStock: number("validation.minStock"),
    isFavorite: z.boolean().default(false),
  });
}

export function createEditSchema(t: Translate) {
  return createProductSchema(t).omit({ quantity: true });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>;
export type EditFormValues = z.infer<ReturnType<typeof createEditSchema>>;
