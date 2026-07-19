import { setRequestLocale } from "next-intl/server";
import AddProductForm from "@/components/product/AddProductForm";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AddPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AddProductForm />;
}
