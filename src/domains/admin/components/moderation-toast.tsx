"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastVariant = "success" | "error";

type ToastMessage = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ModerationToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ModerationToastContext = createContext<ModerationToastContextValue | null>(
  null
);

export function ModerationToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, variant }]);
  }, []);

  const value = useMemo(
    () => ({
      success: (message: string) => push(message, "success"),
      error: (message: string) => push(message, "error"),
    }),
    [push]
  );

  return (
    <ModerationToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ModerationToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  const Icon = toast.variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur",
        toast.variant === "success"
          ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-100"
          : "border-red-500/30 bg-red-950/90 text-red-100"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p className="flex-1">{toast.message}</p>
    </div>
  );
}

export function useModerationToast() {
  const ctx = useContext(ModerationToastContext);
  if (!ctx) {
    throw new Error("useModerationToast must be used within ModerationToastProvider");
  }
  return ctx;
}
