import { setRequestLocale } from "next-intl/server";
import InventoryClient from "@/components/inventory/InventoryClient";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export default async function InventoryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { filter } = await searchParams;
  setRequestLocale(locale);
  const stockFilter = filter === "out" || filter === "low" ? filter : null;
  return <InventoryClient filter={stockFilter} />;
}
