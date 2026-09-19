import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative z-10 flex justify-center px-[30px] py-16">
      <SignIn />
    </div>
  );
}
