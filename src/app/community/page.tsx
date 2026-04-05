"use client";

import CommunityHub from "@/components/CommunityHub";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BreakingTicker from "@/components/BreakingTicker";
import WeatherWidget from "@/components/WeatherWidget";
import { MessageSquare, Users, Info, Shield, ShieldCheck } from "lucide-react";

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex flex-col transition-colors duration-300">
            <Navbar />
            <WeatherWidget />

            <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
                {/* Community Header Section */}
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight flex items-center justify-center gap-3">
                        <Users className="w-10 h-10 text-red-600" />
                        Samachar Bharat <span className="text-red-600">Community</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Join our vibrant community of news enthusiasts. Share your opinions, discuss the latest headlines, and connect with other readers across the country.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Community Hub - 3 columns */}
                    <div className="lg:col-span-3">
                        <CommunityHub />
                    </div>

                    {/* Sidebar - 1 column */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Community Guidelines Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ShieldCheck className="w-24 h-24 text-red-600" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-red-600" />
                                Community Rules
                            </h3>
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex gap-2">
                                    <span className="text-red-600 font-bold">01.</span>
                                    <span>Be respectful to all members. No hate speech or harassment.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-red-600 font-bold">02.</span>
                                    <span>Stick to the topic of news and current events.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-red-600 font-bold">03.</span>
                                    <span>Do not share fake news or unverified rumors.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-red-600 font-bold">04.</span>
                                    <span>Report inappropriate content to our moderation team.</span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

