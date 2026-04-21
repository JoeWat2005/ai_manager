export const clerkAppearance = {
  variables: {
    colorPrimary: "#2563eb",
    colorBackground: "#ffffff",
    colorText: "#0f172a",
    colorInputBackground: "#ffffff",
    colorInputText: "#0f172a",
    colorTextSecondary: "#64748b",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: "w-full",
    card: "w-full shadow-none border-0 bg-transparent p-0",
    headerTitle: "text-xl font-black tracking-tight text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButton:
      "border border-border bg-background hover:bg-muted text-foreground text-sm font-medium rounded-xl transition-colors",
    socialButtonsBlockButtonText: "font-medium",
    formFieldLabel: "text-sm font-medium text-foreground",
    formFieldInput:
      "h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    formButtonPrimary:
      "h-10 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 transition-colors normal-case",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    identityPreviewText: "text-foreground",
    identityPreviewEditButton: "text-primary",
    formResendCodeLink: "text-primary",
    dividerLine: "bg-border",
    dividerText: "text-xs text-muted-foreground",
    alternativeMethodsBlockButton:
      "border border-border bg-background hover:bg-muted text-foreground text-sm font-medium rounded-xl transition-colors",
    otpCodeFieldInput: "rounded-xl border border-input",
  },
};
