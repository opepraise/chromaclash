import type { Metadata } from "next";
import { Silkscreen, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/lib/toast";

const display = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-display" });
const body = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

export const metadata: Metadata = { title: "ChromaClash", description: "Pixel canvas war on Celo. Paint. Claim. Conquer." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${display.variable} ${body.variable}`}>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <Providers>{children}</Providers>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
