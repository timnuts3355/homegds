import ProductDetailClient from "@/components/product/ProductDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) return <p className="p-4 text-muted">無効なIDです</p>;
  return <ProductDetailClient id={numId} />;
}
