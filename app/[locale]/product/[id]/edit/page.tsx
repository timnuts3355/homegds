import { setRequestLocale } from "next-intl/server";
import ProductEditClient from "@/components/product/ProductEditClient";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProductEditPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  // idの妥当性チェックはRepository境界（lib/repositories/products.ts）と
  // ProductEditClientの「商品が見つかりません」表示に委ねる。
  return <ProductEditClient id={id} />;
}
