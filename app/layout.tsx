import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";
import { dark } from "@clerk/themes";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import type { ReactNode } from "react";
import { SPLASH_SCRIPT, SplashScreen } from "@/components/brand/SplashScreen";
import { TransitionProvider } from "@/components/motion/TransitionProvider";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "اختياري", template: "%s · اختياري" },
  description: "صوّر أي أكل أو منتج واعرف إذا كان مناسباً لصحتك.",
  applicationName: "اختياري",
};

export const viewport: Viewport = {
  themeColor: "#11151c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Root layout: Clerk (Arabic, dark, brand colors), the font, page
 * transitions and the logo splash. Arabic is the default, so the document
 * is right-to-left.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      localization={arSA}
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: "#f3f5f9",
          colorPrimaryForeground: "#11151c",
          colorBackground: "#212d40",
          colorForeground: "#f3f5f9",
          colorMutedForeground: "#b9c3d3",
          colorInput: "#11151c",
          colorInputForeground: "#f3f5f9",
          colorNeutral: "#f3f5f9",
          fontFamily: "var(--font-plex-arabic)",
          borderRadius: "12px",
        },
      }}
    >
      {/* suppressHydrationWarning: SPLASH_SCRIPT sets data-splash before React loads. */}
      <html lang="ar" dir="rtl" className={plexArabic.variable} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
        </head>
        <body className="min-h-dvh bg-ink text-fg">
          <SplashScreen />
          <TransitionProvider>{children}</TransitionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
