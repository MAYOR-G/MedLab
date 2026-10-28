import { Metadata } from "next";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = {
  title: "Create Vault Account — MedLab",
  description: "Create an encrypted family medical records vault.",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
