import type { Metadata } from "next";
import { LoginPage } from "@/components/auth/login-page";

export const metadata: Metadata = {
  title: "Log in",
};

export default function Home() {
  return <LoginPage />;
}
