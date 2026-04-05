"use client";

import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning";
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    loading = false,
    onConfirm,
    onCancel,
}: Props) {
    // Close on Escape key
    useEffect(() => {
        function handleEsc(e: KeyboardEvent) {
            if (e.key === "Escape" && !loading) onCancel();
        }
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [isOpen, loading, onCancel]);

    if (!isOpen) return null;

    const confirmClasses =
        variant === "danger"
            ? "bg-red-600 hover:bg-red-700 shadow-red-600/25"
            : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={loading ? undefined : onCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700"
                >
                    <X size={18} />
                </button>

                {/* Icon */}
                <div
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${variant === "danger"
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                >
                    <AlertTriangle size={24} />
                </div>

                {/* Content */}
                <h3 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>
                <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all disabled:opacity-50 ${confirmClasses}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
