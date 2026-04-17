import type { Metadata } from "next";
import { Exo_2, Geist_Mono } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Consensus",
  description: "Predict what your group thinks. Score points for getting close.",
  openGraph: {
    title: "Consensus — Wisdom of the Crowds",
    description: "Predict what your group thinks. Score points for getting close.",
    url: "https://consensusgame.vercel.app",
    siteName: "Consensus",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Consensus — Wisdom of the Crowds",
    description: "Predict what your group thinks. Score points for getting close.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${exo2.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
