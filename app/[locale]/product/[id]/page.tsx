import { setRequestLocale } from "next-intl/server";
import ProductDetailClient from "@/components/product/ProductDetailClient";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  // idの妥当性チェックはRepository境界（lib/repositories/products.ts）と
  // ProductDetailClientの「商品が見つかりません」表示に委ねる。
  return <ProductDetailClient id={id} />;
}
