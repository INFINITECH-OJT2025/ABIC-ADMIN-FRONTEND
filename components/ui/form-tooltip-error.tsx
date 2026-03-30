"use client"

import React from "react"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormTooltipErrorProps {
  message?: string
  onClose?: () => void
  darkMode?: boolean
}

export default function FormTooltipError({
  message,
  onClose,
  darkMode = false,
}: FormTooltipErrorProps) {
  if (!message) return null
  return (
    <div className="relative mt-2">
      <div className="absolute left-0 right-0 z-[999]">
        <div
          className={cn(
            "relative flex items-start gap-3 rounded-md border px-3 py-2 text-sm shadow-xl animate-in fade-in slide-in-from-top-1 duration-200",
            darkMode
              ? "border-gray-600 bg-gray-800 text-gray-200"
              : "border-gray-300 bg-white text-gray-800",
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />

          <div className="flex-1">{message}</div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "transition-colors",
                darkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
