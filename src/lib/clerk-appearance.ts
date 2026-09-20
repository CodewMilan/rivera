export const clerkAppearance = {
  variables: {
    colorPrimary: "#c2b8ff",
    colorPrimaryForeground: "#221d2a",
    colorForeground: "#f4f2f0",
    colorMutedForeground: "#928c97",
    colorMuted: "#1f1c26",
    colorBackground: "#27262d",
    colorInput: "#1f1c26",
    colorInputForeground: "#f4f2f0",
    colorDanger: "#e08a7d",
    colorNeutral: "#c2b8ff",
    colorBorder: "rgba(194, 184, 255, 0.22)",
    colorRing: "#c2b8ff",
    colorShadow: "rgba(12, 10, 16, 0.4)",
    colorModalBackdrop: "rgba(12, 10, 16, 0.72)",
    borderRadius: "5px",
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontWeight: {
      normal: 300,
      medium: 400,
      semibold: 400,
      bold: 400,
    },
  },
  options: {
    elevation: "flush" as const,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    unsafe_disableDevelopmentModeWarnings: true,
    logoImageUrl: "/figma/rivera-mark.svg",
    logoLinkUrl: "/",
    termsPageUrl: "/#grid",
    privacyPageUrl: "/#grid",
  },
  elements: {
    rootBox: "mx-auto",
    userButtonBox: "w-auto shrink-0",
    userButtonTrigger: "w-auto",
    cardBox: "w-full shadow-none",
    card: "w-full border border-[rgba(194,184,255,0.22)] bg-[rgba(39,38,45,0.88)] shadow-none",
    headerTitle: "text-[29px] font-normal leading-[36px] tracking-[-0.4px] text-[#f4f2f0]",
    headerSubtitle: "text-[15px] font-light leading-[24px] text-[#928c97]",
    socialButtonsBlockButton:
      "h-11 border border-[#c2b8ff] bg-transparent text-[15px] font-normal text-[#c2b8ff] shadow-none hover:bg-[rgba(194,184,255,0.08)]",
    socialButtonsBlockButtonText: "text-[#c2b8ff]",
    dividerLine: "bg-[rgba(194,184,255,0.22)]",
    dividerText: "text-[#928c97]",
    formFieldLabel: "text-[14px] font-normal text-[#f4f2f0]",
    formFieldInput:
      "h-11 border-white/20 bg-[#1f1c26] text-[15px] text-[#f4f2f0] placeholder:text-[#928c97] focus:ring-2 focus:ring-[#c2b8ff]",
    formButtonPrimary:
      "h-11 border border-white bg-white text-[15.6px] font-normal text-[#221d2a] shadow-none hover:bg-[#f4f2f0]",
    footer: "bg-transparent",
    footerActionText: "text-[#928c97]",
    footerActionLink: "text-[#c2b8ff] hover:text-[#f4f2f0]",
    identityPreviewEditButton: "text-[#c2b8ff]",
    formFieldAction: "text-[#c2b8ff]",
    otpCodeFieldInput: "border-white/20 bg-[#1f1c26] text-[#f4f2f0]",
    userButtonPopoverCard: "border border-[rgba(194,184,255,0.22)] bg-[#27262d]",
    userButtonPopoverActionButton: "text-[#f4f2f0] hover:bg-[#1f1c26]",
    userButtonPopoverActionButtonText: "text-[#f4f2f0]",
    userButtonPopoverFooter: "hidden",
  },
};

export const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in to keep launching with Rivera.",
    },
  },
  signUp: {
    start: {
      title: "Create your account",
      subtitle: "Research, planning, and production in your own cloud.",
    },
  },
};
