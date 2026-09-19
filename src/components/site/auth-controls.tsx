import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { NavOutlineLink } from "@/components/site/buttons";

export function AuthNavLink() {
  return (
    <Show when="signed-out">
      <SignInButton>
        <button type="button" className="px-[15px] text-[15px] leading-[24px] text-[#f4f2f0]">
          Login
        </button>
      </SignInButton>
    </Show>
  );
}

export function AuthActions() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <NavOutlineLink href="/#intake">Create an org</NavOutlineLink>
      <Show when="signed-out">
        <SignUpButton>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[5px] border border-white bg-white px-[9.63px] py-px text-[13.4px] leading-[30.24px] text-[#221d2a]"
          >
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              rootBox: "mx-0 w-auto shrink-0",
              userButtonBox: "w-auto shrink-0",
              userButtonTrigger: "w-auto",
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </Show>
    </div>
  );
}
