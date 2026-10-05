// components/admin/ui/ConfirmDialog.tsx
// Compact confirmation dialog

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
            <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-sm">
                    ⚠️
                </div>
                <p className="text-gray-600 text-xs leading-relaxed pt-1">{message}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50 focus:ring-2 focus:ring-offset-1 ${confirmColor}`}
                >
                    {loading ? (
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
