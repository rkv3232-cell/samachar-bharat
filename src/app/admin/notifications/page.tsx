"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Bell, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

export default function NotificationCenter() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        body: "",
        imageUrl: "",
        link: "",
        secret: "sb_admin_9x7k2p4m8v_secret", // This should match your env ADMIN_API_SECRET
    });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.body) {
            toast.error("Title and message are required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/notifications/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`Success: ${data.message}`);
                setFormData({ ...formData, title: "", body: "", imageUrl: "", link: "" });
            } else {
                toast.error(data.error || "Failed to send notification");
            }
        } catch (err) {
            toast.error("Connection error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3.5 max-w-2xl">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                    <Bell className="w-4 h-4" />
                </div>
                <div>
                    <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">नोटिफिकेशन सेंटर</h1>
                    <p className="text-xs text-gray-500">अपने पाठकों को तुरंत ताज़ा खबरें भेजें</p>
                </div>
            </div>

            <form onSubmit={handleSend} className="space-y-3 bg-white p-4 rounded-xl shadow-2xs border border-gray-200/90">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">हेडलाइन (Title) *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="जैसे: ब्रेकिंग न्यूज़: भारत ने जीता गोल्ड!"
                        className="h-8 w-full px-2.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">विवरण (Message body) *</label>
                    <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        placeholder="खबर के बारे में संक्षेप में लिखें..."
                        rows={2}
                        className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-gray-400" /> इमेज URL
                        </label>
                        <input
                            type="text"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="h-8 w-full px-2.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5 text-gray-400" /> क्लिक लिंक
                        </label>
                        <input
                            type="text"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="कहाँ भेजना है? (/post/123)"
                            className="h-8 w-full px-2.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`h-8 w-full flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-[0.99] ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-xs"
                            }`}
                    >
                        {loading ? (
                            "भेजा जा रहा है..."
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                नोटिफिकेशन ब्रॉडकास्ट करें
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-[11px] text-blue-700 leading-relaxed">
                    <strong>Tip:</strong> यह नोटिफिकेशन उन सभी यूज़र्स को जाएगा जिन्होंने आपकी वेबसाइट पर 'Allow Notifications' किया है। सटीक लिंक डालने से पाठकों की संख्या (Traffic) बढ़ेगी।
                </p>
            </div>
        </div>
    );
}
