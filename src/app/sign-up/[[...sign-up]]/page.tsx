import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative z-10 flex justify-center px-[30px] py-16">
      <SignUp />
    </div>
  );
}
