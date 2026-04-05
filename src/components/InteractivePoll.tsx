"use client";

import { useState, useEffect } from "react";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase.js";
import { toast } from "sonner";

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

interface PollData {
    id: string;
    question: string;
    options: PollOption[];
    totalVotes: number;
}

const DEFAULT_POLL: PollData = {
    id: "active-poll",
    question: "आप समाचार पढ़ने के लिए किस माध्यम का सबसे ज़्यादा इस्तेमाल करते हैं?",
    options: [
        { id: "opt1", text: "News Apps (NewsPortal, Inshorts)", votes: 0 },
        { id: "opt2", text: "Social Media (X, Facebook, YouTube)", votes: 0 },
        { id: "opt3", text: "Newspaper (Printed)", votes: 0 },
        { id: "opt4", text: "TV News Channels", votes: 0 },
    ],
    totalVotes: 0
};

export default function InteractivePoll() {
    const [poll, setPoll] = useState<PollData>(DEFAULT_POLL);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

    useEffect(() => {
        const pollId = "active-poll";

        // 1. Recover from local storage immediately for speed
        const savedVote = localStorage.getItem(`poll_voted_${pollId}_option`);
        const cachedPoll = localStorage.getItem(`poll_voted_${pollId}_data`);

        if (savedVote) {
            setHasVoted(true);
            setSelectedOptionId(savedVote);
        }
        if (cachedPoll) {
            try {
                setPoll(JSON.parse(cachedPoll));
            } catch (e) { }
        }

        // 2. Refresh from Server
        const fetchPoll = async () => {
            try {
                const pollRef = doc(db, "polls", pollId);
                const snap = await getDoc(pollRef);
                if (snap.exists()) {
                    const data = snap.data() as PollData;
                    setPoll({ ...data, id: pollId });
                    localStorage.setItem(`poll_voted_${pollId}_data`, JSON.stringify(data));
                } else {
                    await setDoc(pollRef, { ...DEFAULT_POLL, id: pollId });
                    setPoll({ ...DEFAULT_POLL, id: pollId });
                }
            } catch (e) {
                console.error("Poll Server Error:", e);
                toast.error("जनमत लोड करने में विफल");
            }
        };
        fetchPoll();
    }, []);

    const handleVote = async (optionId: string) => {
        if (hasVoted) return;

        // CRITICAL FIX: Direct Calculation for Instant UI Update
        const updatedOptions = poll.options.map(opt => {
            if (opt.id === optionId) return { ...opt, votes: (opt.votes || 0) + 1 };
            return opt;
        });

        const newTotal = (poll.totalVotes || 0) + 1;
        const newPollData = { ...poll, options: updatedOptions, totalVotes: newTotal };

        // 1. Update UI Instantly
        setPoll(newPollData);
        setHasVoted(true);
        setSelectedOptionId(optionId);

        // 2. Persist locally
        localStorage.setItem(`poll_voted_active-poll_option`, optionId);
        localStorage.setItem(`poll_voted_active-poll_data`, JSON.stringify(newPollData));

        // 3. Sync with Firebase in background
        try {
            const pollRef = doc(db, "polls", "active-poll");
            updateDoc(pollRef, {
                totalVotes: increment(1),
                options: updatedOptions
            }).catch(e => console.error("Firebase Sync Fail:", e));
        } catch (e) {
            console.error("Poll Error:", e);
            toast.error("वोट देने में विफल: कृपया दोबारा प्रयास करें");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6 shadow-xl shadow-indigo-100/20 dark:shadow-none mb-8 transition-colors">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full flex items-center justify-center shadow-inner">
                    <BarChart3 size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">जनमत (Public Poll)</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{poll.totalVotes} ताज़ा वोट</p>
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6 leading-tight">
                {poll.question}
            </h3>

            <div className="space-y-3">
                {poll.options.map((option) => {
                    const percentage = poll.totalVotes > 0
                        ? Math.round((option.votes / poll.totalVotes) * 100)
                        : 0;

                    const isSelected = selectedOptionId === option.id;

                    return (
                        <div key={option.id} className="relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => handleVote(option.id)}
                                disabled={hasVoted}
                                className={`w-full relative z-10 flex items-center justify-between p-4 transition-all text-left
                                    ${hasVoted
                                        ? isSelected
                                            ? 'bg-indigo-50/50 dark:bg-indigo-900/20'
                                            : 'opacity-70'
                                        : 'bg-white dark:bg-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600 scale-125' : 'bg-gray-300 dark:bg-gray-700'}`} />
                                    <span className={`font-bold text-sm ${isSelected ? 'text-indigo-950 dark:text-indigo-200' : 'text-gray-600'}`}>
                                        {option.text}
                                    </span>
                                </div>
                                {hasVoted && (
                                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                        {percentage}%
                                    </span>
                                )}
                            </button>

                            {hasVoted && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-indigo-100/40 dark:bg-indigo-600/10 transition-all duration-1000 ease-out z-0"
                                    style={{ width: `${percentage}%` }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {hasVoted && (
                <div className="mt-6 flex justify-center items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">वोट देने के लिए धन्यवाद!</span>
                </div>
            )}
        </div>
    );
}
