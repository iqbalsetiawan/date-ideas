import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

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
  title: {
    default: "Date Ideas - Plan Your Perfect Date",
    template: "%s | Date Ideas"
  },
  description: "Discover and organize amazing date ideas for food and places. Create, manage, and track your favorite romantic spots and dining experiences.",
  keywords: ["date ideas", "romantic places", "restaurants", "dating", "couples", "romance", "food", "places"],
  authors: [{ name: "Date Ideas App" }],
  creator: "Date Ideas App",
  publisher: "Date Ideas App",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: ["/favicon.ico", "/favicon.png"],
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Date Ideas - Plan Your Perfect Date",
    description: "Discover and organize amazing date ideas for food and places. Create, manage, and track your favorite romantic spots and dining experiences.",
    url: "/",
    siteName: "Date Ideas",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Date Ideas - Plan Your Perfect Date",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Date Ideas - Plan Your Perfect Date",
    description: "Discover and organize amazing date ideas for food and places.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const pref = localStorage.getItem('theme'); const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches; const isDark = pref ? pref === 'dark' : systemDark; const root = document.documentElement; root.classList[isDark ? 'add' : 'remove']('dark'); } catch (_) {} })();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
