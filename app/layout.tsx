import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          richColors={false}
          expand={true}
          gap={10}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: [
                "flex items-start gap-4 w-full min-w-[360px] max-w-[440px]",
                "rounded-2xl px-5 py-4 shadow-2xl",
                "border border-white/20",
                "backdrop-blur-md",
                "font-sans",
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
              description: "text-stone-500 text-sm mt-1 leading-relaxed",
              icon: "mt-0.5 flex-shrink-0 [&>svg]:w-6 [&>svg]:h-6",
              closeButton: [
                "!bg-white/20 !border-white/30 hover:!bg-white/30",
                "!text-white rounded-full transition-all",
              ].join(" "),
              actionButton: [
                "!bg-white/20 !text-white font-bold text-xs px-3 py-1.5",
                "rounded-lg border border-white/30 hover:!bg-white/30 transition-all",
              ].join(" "),
              cancelButton: [
                "!bg-white/10 !text-white/70 font-bold text-xs px-3 py-1.5",
                "rounded-lg border border-white/20 hover:!bg-white/20 transition-all",
              ].join(" "),
            },
          }}
        />
      </body>
    </html>
  );
}