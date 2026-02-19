import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://the5stacks.com"),
  title: {
    default: "The 5 Stacks Baseline",
    template: "%s | The 5 Stacks Baseline",
  },
  description:
    "Build your defensible sustainability baseline. The Five Stacks Framework — turn compliance into competitive advantage.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "The 5 Stacks Baseline",
    title: "The 5 Stacks Baseline",
    description:
      "Build your defensible sustainability baseline. The Five Stacks Framework — turn compliance into competitive advantage.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "The 5 Stacks Baseline" }],
  },
  twitter: {
    card: "summary",
    title: "The 5 Stacks Baseline",
    description:
      "Build your defensible sustainability baseline. Turn compliance into competitive advantage.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
