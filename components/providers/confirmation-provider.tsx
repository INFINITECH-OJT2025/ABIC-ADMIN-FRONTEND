"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, HelpCircle, Info, LucideIcon } from "lucide-react";

interface ConfirmationOptions {
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: "danger" | "warning" | "info" | "success";
  icon?: LucideIcon;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirmation must be used within a ConfirmationProvider");
  }
  return context;
}

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = (opts: ConfirmationOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (!options) return;
    setIsLoading(true);
    try {
      await options.onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (options?.onCancel) options.onCancel();
    setIsOpen(false);
  };

  const Icon = options?.icon || 
    (options?.variant === "danger" ? AlertCircle : 
     options?.variant === "warning" ? AlertCircle : 
     options?.variant === "success" ? Info : HelpCircle);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !isLoading && setIsOpen(open)}>
        <DialogContent className="bg-white border-2 border-[#FFE5EC] rounded-2xl max-w-sm p-6 shadow-2xl">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className={cn(
              "p-4 rounded-full",
              options?.variant === "danger" ? "bg-red-50 text-red-600" :
              options?.variant === "warning" ? "bg-amber-50 text-amber-600" :
              options?.variant === "success" ? "bg-emerald-50 text-emerald-600" :
              "bg-red-50 text-[#4A081A]" // Default ABIC Maroon
            )}>
              <Icon className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-[#4A081A]">
                {options?.title || "Confirm Action"}
              </DialogTitle>
              <DialogDescription className="text-black font-medium leading-relaxed">
                {options?.description}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold h-12 rounded-xl transition-all"
            >
              {options?.cancelText || "Cancel"}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1 text-white font-bold h-12 rounded-xl shadow-md transition-all active:scale-95",
                options?.variant === "danger" ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" :
                "bg-gradient-to-r from-[#4A081A] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E]"
              )}
            >
              {isLoading ? "Processing..." : (options?.confirmText || "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmationContext.Provider>
  );
}
