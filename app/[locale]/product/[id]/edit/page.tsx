import { setRequestLocale } from "next-intl/server";
import ProductEditClient from "@/components/product/ProductEditClient";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProductEditPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const numId = Number(id);
  if (isNaN(numId)) return <p className="p-4 text-muted">無効なIDです</p>;
  return <ProductEditClient id={numId} />;
}
