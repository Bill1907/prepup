import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/providers/query-provider";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrepUp - AI-Powered Interview Preparation Platform",
  description:
    "Ace your next interview with PrepUp. Get personalized resume feedback, practice with AI-powered mock interviews, and prepare for your dream job with confidence.",
  keywords:
    "interview preparation, resume review, mock interview, AI interview, job interview, career preparation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <QueryProvider>
            <Navigation />
            <main className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
              {children}
            </main>
            <Footer />
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
