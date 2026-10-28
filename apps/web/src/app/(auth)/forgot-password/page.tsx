import { Metadata } from "next";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = {
  title: "Reset Password — MedLab",
  description: "Reset your MedLab account password.",
};

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot-password" />;
}
