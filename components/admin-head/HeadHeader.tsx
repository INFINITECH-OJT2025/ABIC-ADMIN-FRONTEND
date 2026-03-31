"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard, LucideIcon } from "lucide-react";

// Simplified NavEntry for compatibility
export type NavEntry = {
  type: "link" | "group";
  label: string;
  href?: string;
  icon?: any;
  items?: NavEntry[];
};

function findNavMeta(navigation: NavEntry[], pathname: string): { label?: string; icon?: any } | undefined {
  for (const item of navigation) {
    if (item.type === "link") {
      if (item.href === pathname) return item;
    }
    if (item.type === "group" && item.items) {
      const subItem = item.items.find(i => i.href === pathname);
      if (subItem) return subItem;
    }
  }
  return undefined;
}

interface HeadHeaderProps {
  navigation: NavEntry[];
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  primaryAction?: React.ReactNode;
  breadcrumbLabel?: string;
}

export default function HeadHeader({
  navigation,
  title: titleOverride,
  subtitle,
  icon: iconOverride,
  primaryAction,
  breadcrumbLabel = "Management",
}: HeadHeaderProps) {
  const pathname = usePathname();
  const meta = findNavMeta(navigation, pathname);

  const Icon = (iconOverride ?? (meta?.icon as LucideIcon) ?? LayoutDashboard) as LucideIcon;
  const title = titleOverride ?? meta?.label ?? "Management";

  return (
    <div className="relative overflow-hidden bg-[#5F0C18] text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7B0F2B] via-[#5F0C18] to-[#450A13]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[100%] bg-rose-500/20 rounded-full blur-[120px] animate-pulse" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm10 10h1v1h-1v-1z' fill='%23fff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
        />
      </div>

      <div className="relative z-10 px-6 sm:px-8 pt-8 pb-16 sm:pt-10 sm:pb-20">
        <div className="flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          <span className="hover:text-white/80 transition-colors cursor-pointer">Admin Panel</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-rose-300/80">{breadcrumbLabel}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0 mt-1">
              <div className="absolute inset-0 bg-white/20 blur-md rounded-xl" />
              <div className="relative w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl">
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none italic uppercase">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-white/60 text-sm sm:text-base font-medium max-w-lg">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {primaryAction && (
            <div className="flex items-center pb-1">
               <div className="p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner">
                {primaryAction}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
