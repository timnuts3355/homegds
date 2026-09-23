import { setRequestLocale } from "next-intl/server";
import LoginClient from "@/components/auth/LoginClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LoginClient />;
}
