'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { UserRole } from '@/types/auth.types';
import { fetchCategories } from '@/lib/firestore/categories';
import type { Category } from '@/types';
import {
    Home,
    Newspaper,
    ShieldCheck,
    LogIn,
    UserPlus,
    PenTool,
    Crown,
    LogOut,
    Radio,
    Bookmark,
    Users,
    Globe,
    ChevronRight,
    Mail,
    Phone,
    Share2,
    Camera,
    Video,
    ArrowLeft,
    Heart,
    Flame
} from 'lucide-react';
import { motion } from 'framer-motion';

// Fallback Categories
const DEFAULT_CATEGORIES: Category[] = [
    { id: 'uttar-pradesh', name: 'उत्तर प्रदेश', slug: 'uttar-pradesh' },
    { id: 'desh', name: 'देश', slug: 'desh' },
    { id: 'videsh', name: 'विदेश', slug: 'videsh' },
    { id: 'karobar', name: 'कारोबार', slug: 'karobar' },
    { id: 'crime', name: 'क्राइम', slug: 'crime' },
    { id: 'dharm', name: 'धर्म', slug: 'dharm' },
    { id: 'rajniti', name: 'राजनीति', slug: 'rajniti' },
    { id: 'lifestyle', name: 'लाइफस्टाइल', slug: 'lifestyle' },
];

const ADMIN_PANEL_ROLES: UserRole[] = [UserRole.OWNER, UserRole.ADMIN];

export default function MenuPage() {
    const router = useRouter();
    const { user, firestoreUser, role, loading, signOut } = useAuth();
    const { settings } = useSettings();
    const [navCategories, setNavCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

    useEffect(() => {
        fetchCategories()
            .then((data) => {
                const defaultSlugs = new Set(DEFAULT_CATEGORIES.map((c) => c.slug));
                const extraCats = data.filter((c) => !defaultSlugs.has(c.slug));
                setNavCategories([...DEFAULT_CATEGORIES, ...extraCats]);
            })
            .catch(() => { });
    }, []);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const displayName = firestoreUser?.name ?? user?.email?.split('@')[0] ?? 'Guest User';
    const isOwnerEmail = user?.email === 'rkv3232@gmail.com' || user?.email === 'ckv3232@gmail.com';
    const isAdmin = isOwnerEmail || (role && ADMIN_PANEL_ROLES.includes(role));

    return (
        <div className="min-h-screen bg-[#0f172a] text-white selection:bg-red-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 mx-4 mt-4 rounded-2xl md:mx-auto md:max-w-2xl px-4 py-3 flex items-center justify-between shadow-2xl">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-sm font-black tracking-widest uppercase text-red-500">Explore</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">SAMACHAR BHARAT</p>
                </div>
                <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <Home className="w-6 h-6" />
                </Link>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-8 pb-32 space-y-8">
                {/* User Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-red-600 to-orange-600 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
                >
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black shadow-inner ring-4 ring-white/10 group-hover:scale-110 transition-transform">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-white/70">Welcome back</p>
                            <h2 className="text-2xl font-black truncate max-w-[200px]">{displayName}</h2>
                            {role && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/10">
                                    {role}
                                </span>
                            )}
                        </div>
                    </div>
                    {!user && (
                        <div className="mt-6 flex gap-2">
                            <Link href="/login" className="flex-1 py-3 bg-white text-red-600 rounded-2xl text-center font-black text-sm shadow-xl hover:bg-red-50 transition-colors">
                                Login
                            </Link>
                            <Link href="/login?tab=signup" className="flex-1 py-3 bg-black/20 text-white rounded-2xl text-center font-black text-sm backdrop-blur-md border border-white/10 hover:bg-black/30 transition-colors">
                                Signup
                            </Link>
                        </div>
                    )}
                    {/* Abstract elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                </motion.div>

                {/* Main Navigation Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                        <Link href="/live" className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-red-600 transition-all group">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Radio className="w-6 h-6 text-red-500 group-hover:text-white" />
                            </div>
                            <span className="font-black text-sm tracking-wide">Live TV</span>
                        </Link>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
                        <Link href="/explore" className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-blue-600 transition-all group">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Globe className="w-6 h-6 text-blue-500 group-hover:text-white" />
                            </div>
                            <span className="font-black text-sm tracking-wide">World News</span>
                        </Link>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                        <Link href="/bookmarks" className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-amber-600 transition-all group">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Bookmark className="w-6 h-6 text-amber-500 group-hover:text-white" />
                            </div>
                            <span className="font-black text-sm tracking-wide">Saved</span>
                        </Link>
                    </motion.div>
                    {isAdmin && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
                            <Link href="/admin" className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-emerald-600 transition-all group">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                    <Crown className="w-6 h-6 text-emerald-500 group-hover:text-white" />
                                </div>
                                <span className="font-black text-sm tracking-wide">Admin</span>
                            </Link>
                        </motion.div>
                    )}
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 px-2 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" /> Categories
                    </h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                        {navCategories.map((cat, idx) => (
                            <Link
                                key={cat.slug}
                                href={`/category/${cat.slug}`}
                                className={`flex items-center justify-between p-5 hover:bg-white/5 border-b border-white/5 last:border-0 group transition-colors`}
                            >
                                <span className="font-bold text-lg group-hover:text-red-500 transition-colors">{cat.name}</span>
                                <div className="p-2 bg-white/5 rounded-xl group-hover:bg-red-600 transition-all">
                                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Contact & Social */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 px-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" /> Connect
                    </h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-6">
                        <div className="space-y-4">
                            <a href="mailto:samacharbharatgzp@gmail.com" className="flex items-center gap-4 group">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-red-600/20 group-hover:text-red-500 transition-all border border-white/5">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Us</p>
                                    <p className="font-bold text-sm">samacharbharatgzp@gmail.com</p>
                                </div>
                            </a>
                            <a href="tel:+917347718098" className="flex items-center gap-4 group">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-600/20 group-hover:text-emerald-500 transition-all border border-white/5">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Call Us</p>
                                    <p className="font-bold text-sm">+91 734 771 8098</p>
                                </div>
                            </a>
                        </div>
                        <div className="pt-6 border-t border-white/5 flex justify-center gap-6">
                            <a href="https://facebook.com" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all border border-white/10">
                                <Share2 className="w-6 h-6" />
                            </a>
                            <a href="https://instagram.com" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-pink-600 hover:scale-110 transition-all border border-white/10">
                                <Camera className="w-6 h-6" />
                            </a>
                            <a href="https://youtube.com" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all border border-white/10">
                                <Video className="w-6 h-6" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Sign Out (Mobile only visible if logged in) */}
                {user && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSignOut}
                        className="w-full py-5 bg-red-600/10 border border-red-600/20 rounded-[2rem] text-red-500 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-900/10"
                    >
                        <LogOut className="w-5 h-5" /> Sign Out from Account
                    </motion.button>
                )}

                {/* Footer simple */}
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 flex items-center justify-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500 inline" /> for Bharat
                    </p>
                    <p className="text-[9px] text-gray-700 font-bold uppercase">© 2026 SAMACHAR BHARAT NEWS PORTAL</p>
                </div>
            </main>
        </div>
    );
}
