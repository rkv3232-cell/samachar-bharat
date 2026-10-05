"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";

export default function NotificationBell() {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if ("Notification" in window) {
            setPermission(Notification.permission);
            // register sw
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/sw.js")
                    .then(reg => console.log("SW Registered", reg.scope))
                    .catch(err => console.error("SW Register failed", err));
            }
        }
    }, []);

    const requestPermission = async () => {
        const result = await Notification.requestPermission();
        setPermission(result);
        setShowPrompt(false);
        if (result === "granted") {
            // Trigger a welcome notification so the user sees it actually works!
            new Notification("NewsPortal Alerts", {
                body: "सफलतापूर्वक सब्सक्राइब किया गया! ताज़ा ख़बरें अब यहाँ मिलेंगी।",
                icon: "/icon-192x192.png",
            } as any);
        }
    };

    if (!("Notification" in window)) return null;

    return (
        <>
            <button
                onClick={() => permission === "default" ? setShowPrompt(true) : null}
                className={`fixed bottom-24 right-6 z-50 p-3 rounded-full shadow-2xl transition-all duration-300 ${permission === "granted"
 ? "bg-green-500 text-white"
 : "bg-red-600 text-white animate-bounce"
 }`}
                title={permission === "granted" ? "Notifications Active" : "Enable Notifications"}
            >
                {permission === "granted" ? <Bell size={24} /> : <BellOff size={24} />}
            </button>

            {showPrompt && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Bell className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Stay Updated!
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Get real-time alerts for breaking news, live match scores, and daily updates directly on your device.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={requestPermission}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
                                >
                                    Yes, Notify Me
                                </button>
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
