"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Don't show if user previously dismissed
        try {
            if (localStorage.getItem("sb_pwa_dismissed") === "true") {
                return;
            }
        } catch {
            // Ignore storage error
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            try {
                localStorage.setItem("sb_pwa_dismissed", "true");
            } catch {
                // Ignore
            }
        }

        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        try {
            localStorage.setItem("sb_pwa_dismissed", "true");
        } catch {
            // Ignore
        }
    };

    if (!showBanner) return null;

    return (
        <aside
            aria-label="App Install"
            className="fixed bottom-4 right-4 z-40 max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto"
        >
            <div className="bg-white rounded-xl shadow-lg border border-red-200 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                        SB
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs leading-tight truncate">समाचार भारत ऐप</h3>
                        <p className="text-[10px] text-gray-500 leading-tight truncate">तेज़ अनुभव के लिए इंस्टॉल करें</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleInstall}
                        className="bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-red-700 transition-all active:scale-95"
                    >
                        <Download size={13} />
                        इंस्टॉल
                    </button>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
