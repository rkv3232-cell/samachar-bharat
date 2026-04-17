"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent browser from showing the default prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show our custom banner
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
            console.log("User accepted the install prompt");
        }

        setDeferredPrompt(null);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-red-500 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-red-50">
                        SB
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white leading-tight">समाचार भारत ऐप</h3>
                        <p className="text-xs text-gray-500 leading-tight">तेज़ और विज्ञापन-मुक्त अनुभव के लिए इंस्टॉल करें</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleInstall}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-black transition-all active:scale-95"
                    >
                        <Download size={16} />
                        इंस्टॉल करें
                    </button>
                    <button
                        onClick={() => setShowBanner(false)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
