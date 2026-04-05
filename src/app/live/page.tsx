"use client";

import { useEffect, useState } from "react";
import { fetchLiveStatus } from "@/lib/firestore";
import type { LiveStatus } from "@/types";
import LiveSection from "@/components/LiveSection";
import { Loader2, Radio, Tv, Users, MessageCircle, Share2, Heart, Award } from "lucide-react";
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
        <main className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/10 pb-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500">
                            <Radio className="w-4 h-4 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest">Live Streaming Now</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none">
                            Live <span className="text-red-600">TV</span> Hub
                        </h1>
                        <p className="text-gray-400 font-medium max-w-xl">
                            Watch all major news channels live in one place. Stay updated with the latest happenings from across the nation and the world.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                        <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Initializing Secure Stream...</p>
                    </div>
                ) : status ? (
                    <div className="space-y-12">
                        {/* Player Section */}
                        <div className="relative animate-in fade-in zoom-in duration-500">
                            <LiveSection status={status} />

                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/20 blur-[100px] -z-10 rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-600/10 blur-[100px] -z-10 rounded-full" />
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Tv className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold">Offline Temporarily</h2>
                        <p className="text-gray-500 mt-2">Live telecast is currently unavailable. Please check back later.</p>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
