// ============================================================
// components/admin/ui/Modal.tsx
// Reusable modal dialog with backdrop, ESC key support,
// and click-outside-to-close
// ============================================================

"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-md",
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} transform transition-all`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}
