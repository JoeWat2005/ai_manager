// Custom styling configuration for Clerk authentication components
export const clerkAppearance = {

  // Global theme variables (colors, sizing, etc.)
  variables: {
    colorPrimary: "#2563eb",          // Main brand color (buttons, links)
    colorBackground: "#ffffff",       // Page background
    colorText: "#0f172a",             // Primary text color
    colorInputBackground: "#ffffff",  // Input field background
    colorInputText: "#0f172a",        // Input text color
    colorTextSecondary: "#64748b",    // Secondary / muted text
    borderRadius: "0.75rem",          // Rounded corners globally
    fontSize: "0.875rem",             // Base font size
  },

  // Overrides for specific Clerk UI elements
  elements: {

    // Root container
    rootBox: "w-full",

    // Main card container (login/signup box)
    card: "w-full shadow-none border-0 bg-transparent p-0",

    // Header title (e.g. "Sign in")
    headerTitle: "text-xl font-black tracking-tight text-foreground",

    // Subtitle text under header
    headerSubtitle: "text-sm text-muted-foreground",

    // Social login buttons (Google, etc.)
    socialButtonsBlockButton:
      "border border-border bg-background hover:bg-muted text-foreground text-sm font-medium rounded-xl transition-colors",

    // Text inside social buttons
    socialButtonsBlockButtonText: "font-medium",

    // Label above inputs
    formFieldLabel: "text-sm font-medium text-foreground",

    // Input fields (email, password, etc.)
    formFieldInput:
      "h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",

    // Primary action button (Sign in / Sign up)
    formButtonPrimary:
      "h-10 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 transition-colors normal-case",

    // Footer links (e.g. "Don't have an account?")
    footerActionLink: "text-primary hover:text-primary/80 font-medium",

    // Logged-in identity preview text
    identityPreviewText: "text-foreground",

    // Edit button in identity preview
    identityPreviewEditButton: "text-primary",

    // "Resend code" link (OTP)
    formResendCodeLink: "text-primary",

    // Divider line between sections
    dividerLine: "bg-border",

    // Divider text (e.g. "OR")
    dividerText: "text-xs text-muted-foreground",

    // Alternative login methods button
    alternativeMethodsBlockButton:
      "border border-border bg-background hover:bg-muted text-foreground text-sm font-medium rounded-xl transition-colors",

    // OTP (verification code) input boxes
    otpCodeFieldInput: "rounded-xl border border-input",
  },
};