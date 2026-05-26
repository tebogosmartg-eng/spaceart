"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface Toast {
  id: string;
  message: string;
  variant?: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (message: string, variant?: Toast["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: Toast["variant"] = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-24 left-0 right-0 z-[9999] flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "pointer-events-auto flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur-lg",
                t.variant === "success" &&
                  "border-emerald-500/20 bg-emerald-950/80 text-emerald-100",
                t.variant === "error" &&
                  "border-red-500/20 bg-red-950/80 text-red-100",
                t.variant === "info" &&
                  "border-white/10 bg-background/90 text-foreground"
              )}
            >
              {t.variant === "success" && (
                <Check className="size-4 text-emerald-400" />
              )}
              <span>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-1 rounded-full p-0.5 transition-colors hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X className="size-3.5 opacity-60" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}
