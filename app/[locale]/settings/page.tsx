import { setRequestLocale } from "next-intl/server";
import SettingsClient from "@/components/settings/SettingsClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsClient />;
}
