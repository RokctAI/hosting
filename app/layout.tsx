// Tailwind and the shared token set for every route in this shell.
// base_sdk's landing pulls its own extra sheets on top (the platform
// scrollbar); this is the one the root layout owns.
import "./globals.css";

import type { Viewport } from "next";
import { buildSiteMetadata } from "@/app/lib/site-metadata";
import { SessionProvider } from "@/components/custom/session-provider";
import { ThemeProvider } from "@/components/custom/theme-provider";

// The <title>, description, Open Graph and Twitter cards, the generated
// 1200x630 preview and the favicon all come from the copy the home SDK
// (hosting_sdk) registered at components/custom/landing/site-metadata.ts,
// through base_sdk's shell. Nothing is overridden here: the canonical
// origin is NEXT_PUBLIC_SITE_URL when the deployment sets one (this shell
// has no domain yet), and no product copy lives in this file.
export const generateMetadata = () => buildSiteMetadata();

export const viewport: Viewport = {
  // Both schemes are reachable through the header's theme toggle, so the UA
  // must not be told this page is single-scheme.
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: next-themes writes the theme class onto <html>
    // in a blocking script before hydration, so the server markup and the
    // first client render differ here by design.
    <html lang="en" suppressHydrationWarning>
      <body
        // The ground is painted by globals.css's `body { @apply bg-background
        // text-foreground }`, not by an inline colour, so the composed pages'
        // `bg-background` beneath it is what shows in either theme.
        style={{
          margin: 0,
          minHeight: "100dvh",
          // System font stack only: no webfont is fetched at build or run time,
          // so this page has no external dependency to fail on.
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Same ThemeProvider settings as rokctai_frontend's root layout:
            the visitor's system scheme first, the header toggle after. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
