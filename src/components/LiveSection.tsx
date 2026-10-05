"use client";

import { Radio, ExternalLink } from "lucide-react";
import type { LiveStatus } from "@/types";
import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

interface Props {
    status: LiveStatus;
}

export default function LiveSection({ status }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [current, setCurrent] = useState({
        streamUrl: status.streamUrl,
        title: status.title,
        provider: status.provider
    });

    // Use current selection or fallback to base status
    const activeStream = current.streamUrl || status.streamUrl;
    const activeTitle = current.title || status.title;
    const activeProvider = current.provider || status.provider;

    // Handle HLS stream for custom provider
    useEffect(() => {
        if (!status.isActive) return;

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
    }, [activeStream, activeProvider, status.isActive]);

    if (!status.isActive) return null;

    return (
        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-md border border-gray-200 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row">
                {/* Main Player side */}
                <div className="flex-[2] bg-black relative group overflow-hidden">
                    <div className="aspect-video relative">
                        {activeProvider === 'youtube' ? (
                            <iframe
                                key={activeStream}
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
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-red-600 px-2 py-1 text-[9px] font-black tracking-tight text-white shadow-md">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        LIVE
                    </div>
                </div>

                {/* Info & Switcher side */}
                <div className="flex-1 p-4 lg:p-5 flex flex-col bg-white overflow-y-auto max-h-[220px] md:max-h-none border-t md:border-t-0 md:border-l border-gray-200">
                    <div className="mb-2 inline-flex items-center gap-1.5 text-red-600">
                        <Radio size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Multi-Live Hub</span>
                    </div>

                    <h2 className="mb-3 text-sm font-extrabold text-gray-900 line-clamp-2 md:text-base leading-snug">
                        {activeTitle}
                    </h2>

                    {/* Grid of channels */}
                    {status.channels && status.channels.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            {status.channels.map((ch) => (
                                <button
                                    key={ch.id}
                                    type="button"
                                    onClick={() => setCurrent({
                                        streamUrl: ch.streamUrl,
                                        title: ch.title,
                                        provider: ch.provider
                                    })}
                                    className={`group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] ${activeStream === ch.streamUrl
                                        ? 'border-red-600 bg-red-50 text-red-700 shadow-xs'
                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <p className={`text-[11px] font-bold leading-tight line-clamp-1 ${activeStream === ch.streamUrl ? 'text-red-700 font-extrabold' : 'text-gray-700'}`}>
                                        {ch.title}
                                    </p>
                                    {activeStream === ch.streamUrl && (
                                        <div className="absolute top-1.5 right-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
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
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-xs font-bold uppercase text-white transition-all hover:bg-red-700 shadow-xs active:scale-[0.98]"
                            >
                                <ExternalLink size={14} />
                                View Source
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom accent border */}
            <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />
        </section>
    );
}
