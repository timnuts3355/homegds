import { setRequestLocale } from "next-intl/server";
import HomeClient from "@/components/home/HomeClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeClient />;
}
