"use client";

import Link from 'next/link';
import { Newspaper, Info, ShieldCheck, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth.types';

export default function Footer() {
    const { user, isAdmin, isEditor, isReporter, isOwner, loading, role } = useAuth();
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    const hasPanelAccess = !loading && user && (isOwner || isAdmin || isEditor || isReporter);

    return (
        <footer className="bg-gray-900 text-white mt-16 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Brand Section */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold uppercase tracking-tight leading-none">
                                <span className="text-red-500">SAMACHAR</span> BHARAT
                            </h2>
                            <p className="text-[10px] text-gray-500 font-medium">LATEST HINDI NEWS</p>
                        </div>
                    </div>

                    {/* Navigation Hub Button */}
                    <Link
                        href="/menu"
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 text-sm font-bold transition-all group"
                    >
                        <Info className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                        Explore Full Menu & Categories
                    </Link>

                    {/* Quick Access / Panel */}
                    <div className="flex items-center gap-4">
                        {hasPanelAccess ? (
                            <Link
                                href={isAdmin ? "/admin" : "/editor"}
                                className="text-xs font-bold text-gray-500 hover:text-red-400 flex items-center gap-1.5 transition-colors"
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {isAdmin ? "ADMIN CONTROL" : "PANEL"}
                            </Link>
                        ) : (
                            <Link href="/login" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">LOGIN</Link>
                        )}
                        <span className="w-1 h-1 rounded-full bg-gray-700 hidden md:block"></span>
                        <p className="text-xs text-gray-500 flex items-center gap-1"> Made with <Heart className="w-3 h-3 text-red-600 fill-red-600" /> in Bharat</p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-6 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-600 font-medium">
                    <p>© {year || '...'} Samachar Bharat. All Rights Reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/terms" className="hover:text-gray-400 transition">Terms</Link>
                        <Link href="/privacy" className="hover:text-gray-400 transition">Privacy</Link>
                        <Link href="/contact" className="hover:text-gray-400 transition">Contact Support</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
