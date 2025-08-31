import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { HandleRequired } from "@/components/auth/handle-required";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gen Art Pixels - Collaborative Pixel Art Platform",
  description: "Create, share, and evolve pixel-based artworks through real-time collaboration. Join the community and express your creativity one pixel at a time.",
  keywords: ["pixel art", "collaborative", "digital art", "community", "creativity"],
  authors: [{ name: "Gen Art Pixels Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
  openGraph: {
    title: "Gen Art Pixels - Collaborative Pixel Art Platform",
    description: "Create, share, and evolve pixel-based artworks through real-time collaboration.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        {/* Skip to main content link for screen readers */}
        <a 
          href="#main-content" 
          className="skip-to-content"
        >
          Skip to main content
        </a>
        
        <AuthProvider>
          <HandleRequired>
            <div id="root" className="relative flex min-h-screen flex-col">
              <main id="main-content" className="flex-1">
                {children}
              </main>
            </div>
          </HandleRequired>
        </AuthProvider>

        {/* Live region for screen reader announcements */}
        <div 
          id="live-region" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        />
      </body>
    </html>
  );
}
