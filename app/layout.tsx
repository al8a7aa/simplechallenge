import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";
import { dark } from "@clerk/themes";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Readex_Pro, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { SPLASH_SCRIPT, SplashScreen } from "@/components/brand/SplashScreen";
import { TransitionProvider } from "@/components/motion/TransitionProvider";
import "./globals.css";

/*
 * Four typefaces, each with one job (see the type roles in globals.css):
 * body (Plex Arabic), display titles (Readex Pro), numbers (Space Grotesk),
 * code labels (Plex Mono). Weights stay within 300–600; 700 is only for
 * the logo wordmark.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});
const readex = Readex_Pro({ subsets: ["arabic", "latin"], weight: ["300", "400", "500"], variable: "--font-readex", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-space-grotesk", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });
const fontVariables = [plexArabic.variable, readex.variable, spaceGrotesk.variable, plexMono.variable].join(" ");

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
          colorMutedForeground: "#c3ccda",
          colorInput: "#11151c",
          colorInputForeground: "#f3f5f9",
          colorNeutral: "#f3f5f9",
          fontFamily: "var(--font-plex-arabic)",
          borderRadius: "16px",
        },
      }}
    >
      {/* suppressHydrationWarning: SPLASH_SCRIPT sets data-splash before React loads. */}
      <html lang="ar" dir="rtl" className={fontVariables} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
        </head>
        <body className="min-h-dvh text-fg">
          <SplashScreen />
          <TransitionProvider>{children}</TransitionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
