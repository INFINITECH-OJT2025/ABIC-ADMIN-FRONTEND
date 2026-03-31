"use client";

import React from "react";

interface HeadListContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function HeadListContainer({ children, className = "" }: HeadListContainerProps) {
  return (
    <div className={`mt-8 sm:mt-10 mb-20 px-4 sm:px-6 lg:px-10 max-w-none mx-auto w-full pb-4 ${className} font-sans`}>
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-tr from-rose-500/5 via-transparent to-amber-500/5 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="relative bg-white/40 backdrop-blur-xl border border-white/60 p-5 sm:p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
          {children}
        </div>
      </div>
    </div>
  );
}
