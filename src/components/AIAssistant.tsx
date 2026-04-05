'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', parts: [{ text: "नमस्ते! मैं न्यूज़पोर्टल का एडवांस AI एनालिस्ट हूँ। मैं आपको ताज़ा खबरें, विश्लेषण और किसी भी विषय पर सटीक जानकारी दे सकता हूँ। आप क्या जानना चाहते हैं?" }] }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
        setMessages((prev) => [...prev, userMessage]);
        if (!messageText) setInput('');
        setIsLoading(true);

        try {
            // Filter out the initial welcome greeting from the context history
            const chatHistory = messages
                .filter(m => m.parts[0].text !== "नमस्ते! मैं न्यूज़पोर्टल का एडवांस AI एनालिस्ट हूँ। मैं आपको ताज़ा खबरें, विश्लेषण और किसी भी विषय पर सटीक जानकारी दे सकता हूँ। आप क्या जानना चाहते हैं?")
                .slice(-8); // Increased context window to 8 messages

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: textToSend,
                    history: chatHistory
                }),
            });

            const data = await response.json();
            if (data.text) {
                setMessages((prev) => [...prev, { role: 'model', parts: [{ text: data.text }] }]);
            } else if (data.error) {
                setMessages((prev) => [...prev, { role: 'model', parts: [{ text: `Error: ${data.error}` }] }]);
            }
        } catch (error) {
            setMessages((prev) => [...prev, { role: 'model', parts: [{ text: "क्षमा करें, मुझे अभी उत्तर देने में समस्या हो रही है।" }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] sm:w-[400px] h-[500px] overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl flex flex-col ring-1 ring-white/20"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 flex items-center justify-between text-white shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-wider">Samachar Bharat AI</h3>
                                    <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest">Advanced Analyst</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-black/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gray-950/30"
                        >
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-red-600 text-white rounded-tr-none border border-red-500'
                                        : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/10'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1.5 opacity-50">
                                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {msg.role === 'user' ? 'Aap' : 'Assistant'}
                                            </span>
                                        </div>
                                        <div className="prose prose-invert prose-sm break-words prose-p:leading-relaxed prose-p:mb-2 last:prose-p:mb-0">
                                            <ReactMarkdown>
                                                {msg.parts[0].text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 border border-white/10">
                                        <Loader2 size={16} className="animate-spin text-red-500" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Typing...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-black/40">
                            {/* Quick Actions */}
                            {!messages.some(m => m.role === 'user') && (
                                <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-1">
                                    {["आज का विश्लेषण", "प्रमुख खबरें", "राजनीति अपडेट", "खेल समाचार"].map((action) => (
                                        <button
                                            key={action}
                                            onClick={() => handleSend(action)}
                                            disabled={isLoading}
                                            className="whitespace-nowrap bg-white/5 border border-white/10 text-gray-300 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-red-600/20 hover:border-red-500/50 transition-all"
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="नमस्ते! किसी भी खबर का विश्लेषण पूछें..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-2 p-2 text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="text-[8px] text-center mt-3 text-gray-500 font-bold uppercase tracking-widest">
                                Created by Raj Verma | AI is experimental.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 ${isOpen ? 'bg-white text-black' : 'bg-red-600 text-white'
                    } border-2 border-white/10`}
            >
                {isOpen ? <X size={26} strokeWidth={2.5} /> : <MessageSquare size={26} strokeWidth={2.5} />}

                {/* Notification Badge */}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-black border-2 border-red-600 text-[8px] font-black text-white px-0.5">
                        <Sparkles size={8} />
                    </div>
                )}
            </motion.button>
        </div>
    );
}
