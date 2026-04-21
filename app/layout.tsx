// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { getAccessibilityBootScript } from "@/lib/accessibility/preferences";
import { clerkAppearance } from "@/lib/clerk/appearance";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deskcaptain",
  description: "AI receptionist for small businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      <html
        lang="en"
        data-theme="light"
        data-a11y-contrast="default"
        data-a11y-motion="default"
        data-a11y-text="default"
        data-scroll-behavior="smooth"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{ __html: getAccessibilityBootScript() }}
          />
        </head>
        <body className="min-h-full bg-background text-foreground">
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster position="bottom-right" richColors />
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        </body>
      </html>
    </ClerkProvider>
  );
}

