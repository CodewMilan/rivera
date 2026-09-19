import { SignIn } from "@clerk/nextjs";
import { AuthBoard } from "@/components/site/auth-board";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthBoard>
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </AuthBoard>
  );
}
