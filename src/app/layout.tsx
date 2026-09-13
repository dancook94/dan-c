import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dan-c.co.uk"),
  title: {
    default: "dan-c — A systematic forex day-trading system",
    template: "%s · dan-c",
  },
  description:
    "A rules-based forex day-trading method developed by a UK professional trader. Live results, methodology, and a course waitlist — not financial advice.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "dan-c — A systematic forex day-trading system",
    description:
      "Public track record, opening-range breakout method, and a course on building trading robots. UK-based. Informational only.",
    url: "https://www.dan-c.co.uk",
    siteName: "dan-c",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
