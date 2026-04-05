"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";
import { ToastMessage, ToastType } from "@/types/admin";

interface ToastContextType {
    toasts: ToastMessage[];
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}

// ─── TOAST ICONS ────────────────────────────────────────────────
function ToastIcon({ type }: { type: ToastType }) {
    switch (type) {
        case "success":
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        case "error":
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        case "warning":
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
    }
}

// ─── TOAST CONTAINER ────────────────────────────────────────────
function ToastContainer({
    toasts,
    removeToast,
}: {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    const colorMap: Record<ToastType, string> = {
        success: "bg-green-500",
        error: "bg-red-500",
        warning: "bg-amber-500",
        info: "bg-blue-500",
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto animate-slide-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white min-w-[320px] max-w-[420px] ${colorMap[toast.type]}`}
                >
                    <ToastIcon type={toast.type} />
                    <span className="flex-1 text-sm font-medium leading-snug">
                        {toast.message}
                    </span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="shrink-0 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}

// ─── PROVIDER ───────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4500);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}
