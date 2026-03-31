import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConfirmationProvider } from "@/components/providers/confirmation-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "ABIC Accounting System",
  description: "Professional accounting management system for ABIC",
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
        className={`${inter.variable} antialiased`}
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <QueryProvider>
          <ConfirmationProvider>{children}</ConfirmationProvider>
        </QueryProvider>
        <Toaster
          position="top-right"
          richColors={false}
          expand={true}
          gap={10}
          closeButton
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: [
                "flex items-center gap-4 w-full min-w-[380px] max-w-[440px]",
                "rounded-2xl pl-6 pr-14 py-4 shadow-2xl",
                "border border-white/20",
                "backdrop-blur-md",
                "font-sans relative",
              ].join(" "),
              // Default / Info — Clean White
              default: [
                "bg-white border border-stone-200",
                "text-stone-900",
                "[&_[data-icon]]:text-[#A4163A]",
              ].join(" "),
              // Success — Emerald Green
              success: [
                "bg-gradient-to-br from-[#065F46] via-[#059669] to-[#10B981]",
                "text-white",
                "[&_[data-icon]]:text-white/80",
              ].join(" "),
              // Error — Amber/Yellow
              error: [
                "bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#FB923C]",
                "text-white",
                "[&_[data-icon]]:text-white/80",
              ].join(" "),
              // Warning — stays amber as well
              warning: [
                "bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#FB923C]",
                "text-white",
                "[&_[data-icon]]:text-white/80",
              ].join(" "),
              title: "font-bold text-base leading-snug tracking-wide",
              description: "text-stone-900 text-sm mt-1 leading-relaxed",
              icon: "mt-0.5 flex-shrink-0 [&>svg]:w-6 [&>svg]:h-6",
              closeButton: [
                "!bg-transparent !border-none !shadow-none",
                "!right-4 !left-auto !top-1/2 !-translate-y-1/2 absolute",
                "!text-current opacity-90 hover:opacity-100 transition-all scale-150",
                "flex items-center justify-center",
              ].join(" "),
              actionButton: [
                "!bg-white/20 !text-white font-bold text-xs px-4 py-2",
                "rounded-lg border border-white/30 hover:!bg-white/30 transition-all",
                "whitespace-nowrap flex-shrink-0 ml-auto mr-2",
              ].join(" "),
              cancelButton: [
                "!bg-white/10 !text-white/70 font-bold text-xs px-4 py-2",
                "rounded-lg border border-white/20 hover:!bg-white/20 transition-all",
                "whitespace-nowrap flex-shrink-0",
              ].join(" "),
            },
          }}
        />
      </body>
    </html>
  );
}
