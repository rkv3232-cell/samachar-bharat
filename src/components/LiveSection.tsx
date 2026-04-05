"use client";

import { Radio, Maximize2, ExternalLink } from "lucide-react";
import type { LiveStatus } from "@/types";

interface Props {
    status: LiveStatus;
}

import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

export default function LiveSection({ status }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [current, setCurrent] = useState({
        streamUrl: status.streamUrl,
        title: status.title,
        provider: status.provider
    });

    if (!status.isActive) return null;

    // Use current selection or fallback to base status
    const activeStream = current.streamUrl || status.streamUrl;
    const activeTitle = current.title || status.title;
    const activeProvider = current.provider || status.provider;

    // Handle HLS stream for custom provider
    useEffect(() => {
        let hls: Hls | null = null;

        if (activeProvider === 'custom' && activeStream && videoRef.current) {
            const video = videoRef.current;

            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(activeStream);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => console.log("Autoplay prevented"));
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = activeStream;
                video.play().catch(() => console.log("Autoplay prevented"));
            }
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [activeStream, activeProvider]);

    return (
        <section className="mb-10 overflow-hidden rounded-2xl bg-gray-900 shadow-xl border border-gray-800 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row">
                {/* Main Player side */}
                <div className="flex-[2] bg-black relative group overflow-hidden">
                    <div className="aspect-video relative">
                        {activeProvider === 'youtube' ? (
                            <iframe
                                key={activeStream} // Force reload iframe on switch
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${activeStream}?autoplay=1&mute=1&rel=0`}
                                title={activeTitle}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                                <video
                                    ref={videoRef}
                                    controls
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}
                    </div>

                    {/* Live Label Overlay */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-red-600 px-2 py-1 text-[9px] font-black tracking-tight text-white shadow-lg">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        LIVE
                    </div>
                </div>

                {/* Info & Switcher side */}
                <div className="flex-1 p-5 lg:p-6 flex flex-col bg-[#010101] overflow-y-auto max-h-[220px] md:max-h-none border-l border-white/5">
                    <div className="mb-2 inline-flex items-center gap-2 text-red-500">
                        <Radio size={16} className="animate-pulse" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">Multi-Live Hub</span>
                    </div>

                    <h2 className="mb-4 text-md font-extrabold text-white line-clamp-2 md:text-lg">
                        {activeTitle}
                    </h2>

                    {/* Grid of channels */}
                    {status.channels && status.channels.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            {status.channels.map((ch) => (
                                <button
                                    key={ch.id}
                                    onClick={() => setCurrent({
                                        streamUrl: ch.streamUrl,
                                        title: ch.title,
                                        provider: ch.provider
                                    })}
                                    className={`group relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all ${activeStream === ch.streamUrl
                                        ? 'border-red-600 bg-red-600/10'
                                        : 'border-transparent bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <p className={`text-[10px] font-black leading-tight uppercase tracking-tight ${activeStream === ch.streamUrl ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                        {ch.title}
                                    </p>
                                    {activeStream === ch.streamUrl && (
                                        <div className="absolute top-1.5 right-1.5">
                                            <div className="h-1 w-1 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-auto">
                            <a
                                href={activeProvider === 'youtube' ? `https://youtube.com/watch?v=${activeStream}` : activeStream}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-[10px] font-black uppercase text-white transition-all hover:bg-red-700 shadow-lg shadow-red-600/20"
                            >
                                <ExternalLink size={14} />
                                View Source
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Breaking News Ticker style border bottom */}
            <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600 shadow-[0_0_15px_#ef4444]" />
        </section>
    );
}
