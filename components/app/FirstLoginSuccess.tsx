"use client";

import React from "react";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FirstLoginSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  darkMode?: boolean;
}

export default function FirstLoginSuccess({
  isOpen,
  onClose,
  userName,
  darkMode = false,
}: FirstLoginSuccessProps) {
  if (!isOpen) return null;

  const BORDER = darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: darkMode ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-lg p-8 shadow-2xl border transition-all duration-300 transform ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
        style={{ borderColor: BORDER }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className={`h-16 w-16 ${darkMode ? "text-yellow-400" : "text-yellow-500"}`} />
        </div>

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-colors duration-300 ${
              darkMode ? "bg-green-900/30" : "bg-green-100"
            }`}
          >
            <CheckCircle2
              className={`h-12 w-12 transition-colors duration-300 ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            />
            {/* Animated ring */}
            <div
              className={`absolute inset-0 rounded-full border-4 animate-ping opacity-20 ${
                darkMode ? "border-green-400" : "border-green-600"
              }`}
            />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h2
            className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Welcome to ABIC Realty & Consultancy Corporation!
          </h2>
          {userName && (
            <p
              className={`text-lg mb-4 transition-colors duration-300 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Hello, <span className="font-semibold">{userName}</span>!
            </p>
          )}
          <p
            className={`text-sm leading-relaxed transition-colors duration-300 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            We're thrilled to have you on board! Before we proceed to your dashboard, you must set up
            some things first. Let's get your account secured.
          </p>
        </div>

        {/* Features List */}
        <div className={`mb-6 space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          <div className="flex items-start gap-2">
            <CheckCircle2
              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            />
            <span className="text-sm">Secure your account with a new password</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2
              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            />
            <span className="text-sm">Explore your personalized dashboard</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2
              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            />
            <span className="text-sm">Access all your tools and resources</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={onClose}
            className={`w-full h-11 font-medium rounded-lg transition-all duration-300 transform hover:scale-105 ${
              darkMode
                ? "bg-[#7B0F2B] hover:bg-[#5E0C20] text-white"
                : "bg-[#7B0F2B] hover:bg-[#5E0C20] text-white"
            }`}
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
