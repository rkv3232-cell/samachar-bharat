'use client';

import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface SpeechPlayerProps {
    title: string;
    content: string;
}

export default function SpeechPlayer({ title, content }: SpeechPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            setSupported(true);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const toggleSpeech = () => {
        if (!supported) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setIsLoading(false);
            return;
        }

        // 1. Preparation
        setIsLoading(true);
        window.speechSynthesis.cancel();

        // 2. Cleanup text
        const cleanText = (title + ". " + content.replace(/<[^>]+>/g, ''))
            .substring(0, 3000)
            .replace(/&nbsp;/g, ' ')
            .trim();

        // 3. Create Utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;

        // 4. Voice Search (Direct matching)
        const voices = window.speechSynthesis.getVoices();
        const hiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
        if (hiVoice) utterance.voice = hiVoice;

        // 5. State Handling
        utterance.onstart = () => {
            setIsPlaying(true);
            setIsLoading(false);
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setIsLoading(false);
        };

        utterance.onerror = (e) => {
            console.warn("Speech Error Handled:", e);
            setIsPlaying(false);
            setIsLoading(false);
        };

        // 6. Safety Timeout: If it doesn't start in 3 seconds, unlock the button
        const safetyTimer = setTimeout(() => {
            if (isLoading && !isPlaying) {
                console.log("Speech timed out, resetting button.");
                setIsLoading(false);
                window.speechSynthesis.cancel();
            }
        }, 3000);

        // 7. Execute with extra safety delay for Chrome
        setTimeout(() => {
            try {
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.error("Speak failed:", err);
                setIsLoading(false);
            }
        }, 200);
    };

    if (!supported) return null;

    return (
        <button
            onClick={toggleSpeech}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold transition-all border ${isPlaying
                    ? 'bg-red-600 text-white border-red-600 shadow-xl scale-105'
                    : 'bg-white text-red-600 border-red-100 hover:border-red-600 hover:bg-red-50 shadow-sm'
                } ${isLoading ? 'opacity-80' : ''}`}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>कनेक्ट हो रहा है...</span>
                </>
            ) : isPlaying ? (
                <>
                    <VolumeX className="w-4 h-4 animate-pulse" />
                    <span>सुनना बंद करें</span>
                </>
            ) : (
                <>
                    <Volume2 className="w-4 h-4" />
                    <span>खबर सुनें (Audio)</span>
                </>
            )}
        </button>
    );
}
