import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <AuthForm mode="signup" />;
}
