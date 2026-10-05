"use client";

import { useState, useEffect } from "react";
import { Radio, Video, Save, Loader2, Play, Square, ExternalLink, Plus, Trash2, GripVertical } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { fetchLiveStatus, saveLiveStatus } from "@/lib/firestore";
import type { LiveStatus, LiveChannel } from "@/types";
import { FormSkeleton } from "@/components/ui/Skeleton";

export default function LiveTelecastPage() {
    const [status, setStatus] = useState<LiveStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const s = await fetchLiveStatus();
                // Ensure channels array exists
                if (!s.channels) s.channels = [];
                setStatus(s);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load live settings");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const getYouTubeID = (url: string) => {
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) return url;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url;
    };

    const handleSave = async (patch: Partial<LiveStatus>) => {
        if (!status) return;

        const newStatus = { ...status, ...patch };

        // Auto-extract IDs for channels
        if (newStatus.channels) {
            newStatus.channels = newStatus.channels.map(ch => ({
                ...ch,
                streamUrl: ch.provider === 'youtube' ? getYouTubeID(ch.streamUrl) : ch.streamUrl
            }));
        }

        setStatus(newStatus);
        setSaving(true);
        try {
            await saveLiveStatus(newStatus);
            toast.success("Live configuration saved!");
        } catch (err) {
            toast.error("Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    const addChannel = () => {
        if (!status) return;
        const newChannel: LiveChannel = {
            id: Date.now().toString(),
            title: "New Channel",
            streamUrl: "",
            provider: "youtube",
            isActive: true
        };
        setStatus({ ...status, channels: [...(status.channels || []), newChannel] });
    };

    const updateChannel = (id: string, patch: Partial<LiveChannel>) => {
        if (!status) return;
        const newChannels = status.channels?.map(ch =>
            ch.id === id ? { ...ch, ...patch } : ch
        );
        setStatus({ ...status, channels: newChannels });
    };

    const removeChannel = (id: string) => {
        if (!status) return;
        const newChannels = status.channels?.filter(ch => ch.id !== id);
        setStatus({ ...status, channels: newChannels });
    };

    if (loading) return <div className="p-8"><FormSkeleton /></div>;

    return (
        <div className="space-y-3.5 max-w-5xl">
            <Toaster position="top-right" />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-lg font-extrabold text-gray-900 tracking-tight">
                        <div className="rounded-lg bg-red-50 p-1.5 text-red-600">
                            <Radio size={18} className={status?.isActive ? "animate-pulse" : ""} />
                        </div>
                        Multi-Live Manager
                    </h1>
                    <p className="text-xs text-gray-500">
                        Broadcast multiple live channels at once
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSave({ isActive: !status?.isActive })}
                        disabled={saving}
                        className={`h-8 flex items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-all active:scale-95 ${status?.isActive
                            ? "bg-red-600 text-white shadow-xs hover:bg-red-700"
                            : "bg-green-600 text-white shadow-xs hover:bg-green-700"
                            }`}
                    >
                        {status?.isActive ? <Square size={13} /> : <Play size={13} />}
                        {status?.isActive ? "Stop All Broadcasts" : "Start Live System"}
                    </button>
                </div>
            </div>

            <div className="space-y-3.5">
                {/* Channel Management */}
                <div className="rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-900">Live Channels</h3>
                        <button
                            onClick={addChannel}
                            className="h-7 flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95"
                        >
                            <Plus size={13} />
                            Add Channel
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {status?.channels?.map((ch, index) => (
                            <div key={ch.id} className="relative rounded-lg border border-gray-200/80 bg-gray-50/50 p-2.5">
                                <div className="grid gap-2.5 md:grid-cols-12 items-end">
                                    <div className="md:col-span-4">
                                        <label className="mb-0.5 block text-[10px] font-bold uppercase text-gray-400">Channel Name</label>
                                        <input
                                            type="text"
                                            value={ch.title}
                                            onChange={(e) => updateChannel(ch.id, { title: e.target.value })}
                                            className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-red-500"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="mb-0.5 block text-[10px] font-bold uppercase text-gray-400">Provider</label>
                                        <select
                                            value={ch.provider}
                                            onChange={(e) => updateChannel(ch.id, { provider: e.target.value as any })}
                                            className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-red-500"
                                        >
                                            <option value="youtube">YouTube</option>
                                            <option value="custom">HLS/M3U8</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="mb-0.5 block text-[10px] font-bold uppercase text-gray-400">URL / Video ID</label>
                                        <input
                                            type="text"
                                            value={ch.streamUrl}
                                            onChange={(e) => updateChannel(ch.id, { streamUrl: e.target.value })}
                                            className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-red-500"
                                        />
                                    </div>
                                    <div className="md:col-span-1 flex justify-end">
                                        <button
                                            onClick={() => removeChannel(ch.id)}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                                {index === 0 && (
                                    <div className="absolute -left-1.5 -top-1.5 flex items-center gap-0.5 rounded bg-blue-600 px-1.5 py-0.2 text-[8px] font-bold text-white shadow-2xs">
                                        <Play size={7} fill="currentColor" />
                                        PRIMARY
                                    </div>
                                )}
                            </div>
                        ))}

                        {status?.channels?.length === 0 && (
                            <div className="py-8 text-center text-gray-400">
                                <Video size={36} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs">No channels added yet.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={() => status && handleSave(status)}
                            disabled={saving}
                            className="h-8 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 text-xs font-bold text-white transition-all hover:bg-black disabled:opacity-50 active:scale-[0.99]"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Configuration
                        </button>
                    </div>
                </div>

                {/* Quick Preview section */}
                {status?.isActive && status.channels && status.channels.length > 0 && (
                    <div className="grid gap-2.5 md:grid-cols-3">
                        {status.channels.slice(0, 3).map(ch => (
                            <div key={ch.id} className="overflow-hidden rounded-xl bg-black border border-gray-800 aspect-video relative group">
                                {ch.provider === 'youtube' ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${getYouTubeID(ch.streamUrl)}?autoplay=0`}
                                        title={ch.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-[10px] text-gray-600">Custom Stream: {ch.title}</div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 text-[10px] font-bold text-white backdrop-blur-sm">
                                    {ch.title}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
