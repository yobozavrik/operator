import type { Metadata } from "next";
import { Geist, Geist_Mono, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chakra = Chakra_Petch({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-chakra",
});

const jetbrains = JetBrains_Mono({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Graviton Production Hub | Управление производством",
  description: "Интеллектуальный дашборд для начальника цеха",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${chakra.variable} ${jetbrains.variable} antialiased bg-bg-primary text-text-primary transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="bg-noise opacity-10 pointer-events-none" />
          <StoreProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
