"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AISummaryProps {
    title: string;
    content: string;
}

export default function AISummary({ title, content }: AISummaryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [points, setPoints] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        // Toggle if already generated
        if (points.length > 0) {
            setIsOpen(!isOpen);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);
        setError("");

        try {
            const response = await fetch("/api/ai/post-assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, type: "tldr" }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Server error");
            }

            const data = await response.json();

            // API now returns array directly or inside an object
            const summaryPoints = Array.isArray(data) ? data : (data.points || data.summary || []);

            if (Array.isArray(summaryPoints) && summaryPoints.length > 0) {
                setPoints(summaryPoints.slice(0, 4)); // max 4 bullets
            } else if (typeof data === 'string' && data.length > 20) {
                // Fallback for string responses
                setPoints(data.split('\n').filter(p => p.trim()).slice(0, 4));
            } else {
                console.error("AI Response invalid format:", data);
                setError("संक्षेप तैयार नहीं हो पाया। कृपया दोबारा प्रयास करें।");
            }
        } catch (err: any) {
            console.error("AI Summary generation failed:", err);
            setError("AI सेवा अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद प्रयास करें।");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="my-6 rounded-2xl overflow-hidden border border-amber-400/40 bg-gradient-to-br from-amber-50 to-orange-50/40 shadow-sm">
            {/* Header Button */}
            <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-between p-4 bg-amber-100/60 hover:bg-amber-100/90 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                        <Sparkles size={17} />
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-amber-900 text-sm">
                            AI TL;DR — त्वरित सारांश
                        </h4>
                        <p className="text-xs text-amber-700/70 font-medium">
                            पूरी खबर पढ़ने का समय नहीं? ये 3-4 points पढ़ें।
                        </p>
                    </div>
                </div>
                {isOpen ? (
                    <ChevronUp className="text-amber-500 shrink-0" size={18} />
                ) : (
                    <ChevronDown className="text-amber-500 shrink-0" size={18} />
                )}
            </button>

            {/* Content Area */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="px-5 pb-5 pt-4 border-t border-amber-200/60">
                            {isLoading ? (
                                <div className="flex items-center gap-3 text-amber-600 py-3">
                                    <Loader2 className="animate-spin" size={19} />
                                    <span className="text-sm font-semibold">
                                        AI सारांश तैयार कर रहा है…
                                    </span>
                                </div>
                            ) : error ? (
                                <div className="flex items-center gap-2 text-red-600 text-sm py-2">
                                    <AlertTriangle size={16} />
                                    <span>{error}</span>
                                </div>
                            ) : (
                                <>
                                    <ul className="space-y-3 mb-3">
                                        {points.map((point, index) => (
                                            <motion.li
                                                key={index}
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: index * 0.08 }}
                                                className="flex gap-3 text-sm text-gray-700 font-medium leading-relaxed"
                                            >
                                                <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-300 text-amber-900 text-[10px] font-bold mt-0.5">
                                                    {index + 1}
                                                </span>
                                                <span>{point}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                    <p className="text-[10px] text-amber-700/60 font-semibold border-t border-amber-200/50 pt-3 mt-2">
                                        ⚠️ यह सारांश AI द्वारा तैयार किया गया है — मूल खबर पढ़ने की सलाह दी जाती है।
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
