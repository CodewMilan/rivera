import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { NavOutlineLink } from "@/components/site/buttons";

export function AuthNavLink() {
  return (
    <Show when="signed-out">
      <SignInButton>
        <span className="inline-block cursor-pointer px-[15px] text-[15px] leading-[24px] text-[#f4f2f0]">
          Login
        </span>
      </SignInButton>
    </Show>
  );
}

export function AuthActions() {
  return (
    <div className="flex items-center gap-2">
      <NavOutlineLink href="/#intake">Create an org</NavOutlineLink>
      <Show when="signed-out">
        <SignUpButton>
          <span className="inline-flex cursor-pointer items-center justify-center rounded-[5px] border border-white bg-white px-[9.63px] py-px text-[13.4px] leading-[30.24px] text-[#221d2a]">
            Sign up
          </span>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </Show>
    </div>
  );
}
