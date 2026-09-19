import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMRA Sovereign Treasury & YouTube Studio | echosh-labs",
  description: "Port 8050 Sovereign Service: Immutable BoltDB Ledger, YouTube Studio, and Alchemical Shadow Transmutation",
};

import { YouTubeStudioProvider } from "@/lib/youtube-context";
import { ToastProvider } from "@/lib/toast-context";
import YouTubeStudioDock from "@/components/youtube-studio-dock";
import AmraFooter from "@/components/amra-footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[#090d16] text-slate-100 flex flex-col" suppressHydrationWarning>
        <ToastProvider>
          <YouTubeStudioProvider>
            <header className="border-b border-emerald-900/40 bg-[#070d18]/90 backdrop-blur sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    echosh-labs
                  </span>
                  <span className="font-bold tracking-tight text-white font-serif text-lg">
                    amra-treasury
                  </span>
                  <span className="text-xs text-emerald-400/80 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    :8050
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
                  <span className="hidden sm:inline-block">Vedic Fruition &amp; Immutable Ledger</span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-emerald-300 border border-emerald-800/60 flex items-center space-x-1">
                    <span>Sovereign Substrate</span>
                  </span>
                </div>
              </div>
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
            <YouTubeStudioDock />
            <AmraFooter />
          </YouTubeStudioProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
