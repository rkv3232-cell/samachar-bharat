// ============================================================
// components/admin/ui/ConfirmDialog.tsx
// Reusable confirmation dialog for destructive actions
// ============================================================

"use client";

import Modal from "./Modal";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: string;
    loading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    confirmColor = "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-lg">⚠️</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed pt-2">{message}</p>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 focus:ring-2 focus:ring-offset-2 ${confirmColor}`}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        confirmText
                    )}
                </button>
            </div>
        </Modal>
    );
}
