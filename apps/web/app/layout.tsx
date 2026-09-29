import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskPilot - Incident Resolution Hub",
  description: "Enterprise Operational Platform with Multi-Project Resolution & AI Copilot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(
    clerkPubKey &&
      !clerkPubKey.includes("placeholder") &&
      clerkPubKey.startsWith("pk_")
  );

  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#09090b] text-slate-900 dark:text-slate-100 transition-colors">
        {children}
      </div>
      <Toaster position="top-right" richColors theme="system" />
    </ThemeProvider>
  );

  if (!isClerkConfigured) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          {content}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          {content}
        </body>
      </html>
    </ClerkProvider>
  );
}
