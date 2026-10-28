import { Metadata } from "next";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign In — MedLab",
  description: "Sign in to access your family medical records vault.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
