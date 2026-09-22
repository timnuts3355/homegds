import { getTranslations, setRequestLocale } from "next-intl/server";
import ProductDetailClient from "@/components/product/ProductDetailClient";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "product" });
  const numId = Number(id);
  if (isNaN(numId)) return <p className="p-4 text-muted">{t("invalidId")}</p>;
  return <ProductDetailClient id={numId} />;
}
