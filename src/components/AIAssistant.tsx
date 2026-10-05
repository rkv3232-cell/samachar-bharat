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
        { role: 'model', parts: [{ text: "नमस्ते! मैं समाचार भारत का AI सहायक हूँ। मैं आपको देश-दुनिया की ताज़ा खबरें, विश्लेषण और किसी भी विषय पर सटीक जानकारी दे सकता हूँ। आप क्या जानना चाहते हैं?" }] }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Clean up active request on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim() || isLoading) return;

        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
        setMessages((prev) => [...prev, userMessage]);
        if (!messageText) setInput('');
        setIsLoading(true);

        // Add a placeholder for the streaming model response
        setMessages((prev) => [...prev, { role: 'model', parts: [{ text: "" }] }]);

        try {
            const chatHistory = messages
                .filter(m => !m.parts[0].text.startsWith("नमस्ते! मैं समाचार भारत का AI"))
                .slice(-6);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream, application/json'
                },
                body: JSON.stringify({
                    message: textToSend,
                    history: chatHistory,
                    stream: true,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error("Connection failed");

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                const replyText = data.text || data.reply || "माफ़ कीजिए, उत्तर प्राप्त नहीं हो सका।";
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex]?.role === 'model') {
                        newMessages[lastIndex] = {
                            role: 'model',
                            parts: [{ text: replyText }]
                        };
                    }
                    return newMessages;
                });
            } else if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedText = "";
                let buffer = "";

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;
                        const dataStr = trimmed.slice(6).trim();
                        if (dataStr === '[DONE]') continue;

                        try {
                            const json = JSON.parse(dataStr);
                            const content = json.choices?.[0]?.delta?.content || "";
                            if (content) {
                                accumulatedText += content;
                                const nextText = accumulatedText;
                                setMessages((prev) => {
                                    const newMessages = [...prev];
                                    const lastIndex = newMessages.length - 1;
                                    if (newMessages[lastIndex]?.role === 'model') {
                                        newMessages[lastIndex] = {
                                            role: 'model',
                                            parts: [{ text: nextText }]
                                        };
                                    }
                                    return newMessages;
                                });
                            }
                        } catch {
                            // Non-json chunk fragment, safely skip
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                return; // User aborted navigation or closed window
            }
            setMessages((prev) => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                if (last && last.role === 'model' && last.parts[0].text === "") {
                    last.parts = [{ text: "क्षमा करें, सर्वर से कनेक्शन नहीं हो पाया। कृपया कुछ ही क्षणों में पुनः प्रयास करें।" }];
                }
                return newMsgs;
            });
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
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
                        className="mb-4 w-[350px] sm:w-[400px] h-[500px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 flex items-center justify-between text-white shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm tracking-wide">Samachar Bharat AI</h3>
                                    <p className="text-[10px] text-red-100 font-semibold tracking-wider">Gemini Primary • Instant Streaming</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (abortControllerRef.current) abortControllerRef.current.abort();
                                    setIsOpen(false);
                                }}
                                className="p-1.5 hover:bg-black/10 rounded-full transition-colors text-white cursor-pointer"
                                aria-label="Close Assistant"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth bg-slate-50"
                        >
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${msg.role === 'user'
                                        ? 'bg-red-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                                        }`}>
                                        <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                            {msg.role === 'user' ? <User size={11} /> : <Bot size={11} />}
                                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                                {msg.role === 'user' ? 'आप' : 'AI सहायक'}
                                            </span>
                                        </div>
                                        <div className="prose prose-sm break-words prose-p:leading-relaxed prose-p:mb-1.5 last:prose-p:mb-0 text-inherit">
                                            <ReactMarkdown>
                                                {msg.parts[0].text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Only show spinner while waiting for first token */}
                            {isLoading && messages[messages.length - 1]?.parts[0]?.text === "" && (
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-2 border border-gray-200 shadow-2xs">
                                        <Loader2 size={15} className="animate-spin text-red-600" />
                                        <span className="text-[11px] font-semibold text-gray-500">उत्तर लिखा जा रहा है...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3.5 border-t border-gray-200 bg-white">
                            {/* Quick Actions */}
                            {!messages.some(m => m.role === 'user') && (
                                <div className="flex gap-1.5 overflow-x-auto pb-2.5 no-scrollbar mb-1">
                                    {["आज का विश्लेषण", "प्रमुख खबरें", "राजनीति अपडेट", "खेल समाचार"].map((action) => (
                                        <button
                                            key={action}
                                            onClick={() => handleSend(action)}
                                            disabled={isLoading}
                                            className="whitespace-nowrap bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="किसी भी खबर या विषय पर प्रश्न पूछें..."
                                    disabled={isLoading}
                                    className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 pl-3 pr-10 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium disabled:bg-gray-100"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-1.5 p-1.5 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 transition-colors shadow-2xs cursor-pointer"
                                    aria-label="Send Message"
                                >
                                    <Send size={15} />
                                </button>
                            </div>
                            <p className="text-[9px] text-center mt-2 text-gray-400 font-medium">
                                समाचार भारत AI • Gemini 2.5 Primary • OpenRouter Free Fallback
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
                className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 cursor-pointer ${isOpen ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
                    } border border-white/20`}
                aria-label="Toggle AI Assistant"
            >
                {isOpen ? <X size={22} strokeWidth={2.5} /> : <MessageSquare size={22} strokeWidth={2.5} />}

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
