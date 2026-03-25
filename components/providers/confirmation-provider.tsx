"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";

interface ConfirmationOptions {
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: "danger" | "warning" | "info" | "success";
  icon?: any;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(
  undefined,
);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error(
      "useConfirmation must be used within a ConfirmationProvider",
    );
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

  // Map Provider variants to Modal variants
  const getVariant = (): "default" | "destructive" | "success" | "warning" => {
    switch (options?.variant) {
      case "danger":
        return "destructive";
      case "warning":
        return "warning";
      case "success":
        return "success";
      case "info":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <ConfirmationModal
          isOpen={isOpen}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          title={options.title}
          description={
            typeof options.description === "string"
              ? options.description
              : "Please confirm your action"
          }
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          variant={getVariant()}
          isLoading={isLoading}
        />
      )}
    </ConfirmationContext.Provider>
  );
}
