"use client";

import { useEffect } from "react";
import { requestForToken, onMessageListener } from "@/lib/firebase-messaging";
import { toast } from "sonner";

export default function NotificationManager() {
    useEffect(() => {
        // 1. Request Permission and get Token on mount
        const setupNotifications = async () => {
            // Check if browser supports notifications
            if (!("Notification" in window)) {
                console.log("This browser does not support desktop notification");
                return;
            }

            const token = await requestForToken();
            if (token) {
                console.log("Notification system initialized.");
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
