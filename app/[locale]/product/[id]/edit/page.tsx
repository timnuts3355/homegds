import ProductEditClient from "@/components/product/ProductEditClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) return <p className="p-4 text-muted">無効なIDです</p>;
  return <ProductEditClient id={numId} />;
}
