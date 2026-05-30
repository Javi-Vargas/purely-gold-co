import type { Metadata } from "next";
import { Geist, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const displaySerif = Cormorant_Garamond({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Purely GOLD Co. — Campaign Coordination & AI Tools",
  description:
    "Plan, build, and execute marketing campaigns — with AI tools and a vetted directory of production professionals. By invitation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-cream">{children}</body>
    </html>
  );
}
