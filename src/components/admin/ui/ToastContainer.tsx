// ============================================================
// components/admin/ui/ToastContainer.tsx
// Renders floating toast notifications in the top-right corner
// ============================================================

"use client";

import { useToast } from "@/contexts/ToastContext";

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => {
                let bgColor = "bg-blue-600";
                let icon = "ℹ️";

                if (toast.type === "success") {
                    bgColor = "bg-green-600";
                    icon = "✅";
                } else if (toast.type === "error") {
                    bgColor = "bg-red-600";
                    icon = "❌";
                }

                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white min-w-[320px] max-w-[420px] ${bgColor} animate-[slideIn_0.3s_ease-out]`}
                        style={{
                            animation: "slideIn 0.3s ease-out",
                        }}
                    >
                        <span className="text-base">{icon}</span>
                        <span className="flex-1 text-sm font-medium leading-snug">
                            {toast.message}
                        </span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-white/70 hover:text-white text-xl leading-none ml-2 font-light"
                        >
                            ×
                        </button>
                    </div>
                );
            })}

            <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
        </div>
    );
}
