"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  zIndex?: number;
}

export default function LoadingModal({
  isOpen,
  title,
  message,
  zIndex = 200,
}: LoadingModalProps) {
  const [visible, setVisible] = useState(false);
  const openTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      setVisible(true);
    } else if (visible && openTimeRef.current) {
      const elapsed = Date.now() - openTimeRef.current;
      const remaining = Math.max(1000 - elapsed, 0);

      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        openTimeRef.current = null;
      }, remaining);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4 animate-in fade-in duration-500"
      style={{
        zIndex,
        background: "rgba(15, 23, 42, 0.4)", // Slate-900 tint
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="relative w-full max-w-[320px] animate-in zoom-in-95 duration-300">
        
        {/* 1. The Pulsing Squircle Icon */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20">
          <div className="relative">
            {/* Soft pulse rings */}
            <div className="absolute inset-0 rounded-[22px] bg-[#7a0f1f] animate-ping opacity-20" />
            
            <div 
              className="w-20 h-20 rounded-[22px] flex items-center justify-center shadow-2xl relative overflow-hidden border border-white/20"
              style={{ background: "linear-gradient(135deg, #7a0f1f 0%, #5f0c18 100%)" }}
            >
              {/* Inner glass flare */}
              <div className="absolute top-0 right-0 w-full h-full bg-white/10 rounded-full blur-xl -mr-6 -mt-6" />
              
              <Loader2 className="w-9 h-9 text-white animate-spin stroke-[2.5px]" />
            </div>
          </div>
        </div>

        {/* 2. Frosted Card */}
        <div className="bg-white rounded-[28px] p-8 pt-14 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 text-center">
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-black text-slate-900 tracking-tight italic uppercase drop-shadow-sm">
              {title}
            </h2>

            <div className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
              {message}
            </div>

            {/* 3. Creative Progress Bar Indicator */}
            <div className="mt-8 w-full h-1 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="absolute inset-y-0 left-0 bg-[#7a0f1f] rounded-full animate-progress-loading" 
                style={{ width: "40%" }} 
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes progress-loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .animate-progress-loading {
          animation: progress-loading 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}