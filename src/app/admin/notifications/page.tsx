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
        <div className="p-6 max-w-2xl mx-auto min-h-screen bg-transparent">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-red-100 rounded-xl">
                    <Bell className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">नॉरिफिकेशन सेंटर</h1>
                    <p className="text-gray-500 text-sm">अपने पाठकों को तुरंत ताज़ा खबरें भेजें</p>
                </div>
            </div>

            <form onSubmit={handleSend} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">हेडलाइन (Title) *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="जैसे: ब्रेकिंग न्यूज़: भारत ने जीता गोल्ड!"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">विवरण (Message body) *</label>
                    <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        placeholder="खबर के बारे में संक्षेप में लिखें..."
                        rows={3}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> इमेज URL
                        </label>
                        <input
                            type="text"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> क्लिक लिंक
                        </label>
                        <input
                            type="text"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="नॉरिफिकेशन पर क्लिक करने पर कहाँ भेजना है?"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-black shadow-lg shadow-red-100"
                            }`}
                    >
                        {loading ? (
                            "भेजा जा रहा है..."
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                नोटिफिकेशन ब्रॉडकास्ट करें
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Tip:</strong> यह नोटिफिकेशन उन सभी यूज़र्स को जाएगा जिन्होंने आपकी वेबसाइट पर 'Allow Notifications' किया है। सटीक लिंक डालने से पाठकों की संख्या (Traffic) बढ़ेगी।
                </p>
            </div>
        </div>
    );
}
