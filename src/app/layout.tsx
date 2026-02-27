import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StormCode — AI Code Architecture Explainer",
  description:
    "Paste any GitHub repo and get instant AI-powered architecture explanations with dependency graphs, flow diagrams, and beginner-friendly breakdowns.",
  keywords: [
    "code explainer",
    "github analyzer",
    "dependency graph",
    "architecture diagram",
    "AI code explanation",
    "beginner coding",
  ],
  openGraph: {
    title: "StormCode — AI Code Architecture Explainer",
    description:
      "Paste any GitHub repo. Get instant architecture explanations, dependency graphs, and flow diagrams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
