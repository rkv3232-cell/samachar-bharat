"use client";

import { useEffect } from "react";
import { requestForToken, onMessageListener } from "@/lib/firebase-messaging";
import { toast } from "sonner";

export default function NotificationManager() {
    useEffect(() => {
        // 1. Only initialize if permission was already explicitly granted by user
        const setupNotifications = async () => {
            if (typeof window === 'undefined' || !("Notification" in window)) {
                return;
            }

            // Do not prompt the user on cold page load; only register if already granted
            if (Notification.permission !== "granted") {
                return;
            }

            try {
                await requestForToken();
            } catch (err) {
                console.warn("Silent notification init:", err);
            }
        };

        setupNotifications();

        // 2. Listen for foreground messages
        onMessageListener()
            .then((payload: any) => {
                console.log("Message in foreground:", payload);

                // Show a nice toast for foreground notifications
                toast.info(payload.notification.title, {
                    description: payload.notification.body,
                    action: {
                        label: "देखें",
                        onClick: () => {
                            if (payload.data?.url) {
                                window.location.href = payload.data.url;
                            }
                        },
                    },
                });
            })
            .catch((err) => console.log("failed: ", err));
    }, []);

    return null; // This component doesn't render anything visible
}
