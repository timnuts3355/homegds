import { setRequestLocale } from "next-intl/server";
import HistoryClient from "@/components/history/HistoryClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HistoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HistoryClient />;
}
