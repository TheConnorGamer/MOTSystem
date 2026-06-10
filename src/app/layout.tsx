import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@/components/query-client-provider";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VehicleGuard UK | MOT & Tax Reminder Hub",
  description:
    "Check your vehicle's MOT and tax status instantly. Save vehicles, get email reminders, and manage your entire garage in one place.",
  keywords: [
    "MOT check",
    "vehicle tax",
    "DVSA",
    "car MOT",
    "MOT reminder",
    "UK vehicle",
    "car tax",
  ],
  authors: [{ name: "VehicleGuard UK" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "VehicleGuard UK - MOT & Tax Reminder Hub",
    description: "Never miss an MOT or tax deadline again",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <QueryClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
