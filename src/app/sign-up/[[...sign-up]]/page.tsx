import { SignUp } from "@clerk/nextjs";
import { AuthBoard } from "@/components/site/auth-board";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthBoard>
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </AuthBoard>
  );
}
