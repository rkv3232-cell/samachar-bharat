"use client";

import { useEffect, useState } from "react";
import { fetchLiveStatus } from "@/lib/firestore";
import type { LiveStatus } from "@/types";
import LiveSection from "@/components/LiveSection";
import { Loader2, Radio, Tv } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LivePage() {
    const [status, setStatus] = useState<LiveStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchLiveStatus();
                setStatus(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 text-gray-900 flex flex-col">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-gray-200 pb-5">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600">
                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Live Streaming</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-gray-900">
                            Live <span className="text-red-600">TV</span> Hub
                        </h1>
                        <p className="text-gray-500 text-xs md:text-sm font-medium max-w-xl">
                            देश और दुनिया के प्रमुख समाचार चैनलों का लाइव प्रसारण एक ही स्थान पर देखें।
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                        <p className="text-gray-500 font-bold uppercase tracking-wider text-xs">लाइव स्ट्रीम लोड हो रही है...</p>
                    </div>
                ) : status ? (
                    <div className="space-y-6">
                        <LiveSection status={status} />
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
                        <Tv className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h2 className="text-lg font-bold text-gray-800">लाइव प्रसारण फ़िलहाल उपलब्ध नहीं है</h2>
                        <p className="text-gray-500 text-xs mt-1">कृपया कुछ समय बाद पुनः प्रयास करें।</p>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
