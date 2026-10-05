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
    const { user, firestoreUser, role, signOut } = useAuth();
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
        <div className="min-h-screen bg-slate-50 text-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 mx-3 mt-3 rounded-xl md:mx-auto md:max-w-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs">
                <button
                    onClick={() => router.back()}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors active:scale-95"
                    aria-label="Go Back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xs font-black tracking-widest uppercase text-red-600">Explore</h1>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">SAMACHAR BHARAT</p>
                </div>
                <Link
                    href="/"
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors active:scale-95"
                    aria-label="Home"
                >
                    <Home className="w-5 h-5" />
                </Link>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-5">
                {/* User Card */}
                <div className="bg-gradient-to-r from-red-600 via-red-600 to-orange-500 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black shadow-inner ring-2 ring-white/30">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Welcome</p>
                                <h2 className="text-lg font-black truncate max-w-[200px] leading-tight">{displayName}</h2>
                                {role && (
                                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[9px] font-bold uppercase tracking-wider">
                                        {role}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!user && (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="px-3.5 py-1.5 bg-white text-red-600 rounded-lg text-xs font-bold shadow-xs hover:bg-red-50 transition-colors active:scale-95"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/login?tab=signup"
                                    className="px-3.5 py-1.5 bg-black/25 text-white border border-white/30 rounded-lg text-xs font-bold hover:bg-black/35 transition-colors active:scale-95"
                                >
                                    Signup
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Navigation Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Link
                        href="/live"
                        prefetch={true}
                        className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white border border-gray-200/90 rounded-xl hover:border-red-400 hover:shadow-xs hover:bg-red-50/20 transition-all active:scale-[0.98] group"
                    >
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                            <Radio className="w-5 h-5 text-red-600 group-hover:text-white transition-colors" />
                        </div>
                        <span className="font-bold text-xs text-gray-800">Live TV</span>
                    </Link>

                    <Link
                        href="/explore"
                        prefetch={true}
                        className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white border border-gray-200/90 rounded-xl hover:border-blue-400 hover:shadow-xs hover:bg-blue-50/20 transition-all active:scale-[0.98] group"
                    >
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                            <Globe className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <span className="font-bold text-xs text-gray-800">World News</span>
                    </Link>

                    <Link
                        href="/bookmarks"
                        prefetch={true}
                        className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white border border-gray-200/90 rounded-xl hover:border-amber-400 hover:shadow-xs hover:bg-amber-50/20 transition-all active:scale-[0.98] group"
                    >
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                            <Bookmark className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                        </div>
                        <span className="font-bold text-xs text-gray-800">Saved</span>
                    </Link>

                    {isAdmin && (
                        <Link
                            href="/admin"
                            prefetch={true}
                            className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white border border-gray-200/90 rounded-xl hover:border-emerald-400 hover:shadow-xs hover:bg-emerald-50/20 transition-all active:scale-[0.98] group"
                        >
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                                <Crown className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                            </div>
                            <span className="font-bold text-xs text-gray-800">Admin</span>
                        </Link>
                    )}
                </div>

                {/* Categories */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-500" /> Categories
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100">
                        {navCategories.map((cat) => (
                            <Link
                                key={cat.slug}
                                href={`/category/${cat.slug}`}
                                prefetch={true}
                                className="flex items-center justify-between px-4 py-3 hover:bg-red-50/40 transition-colors group"
                            >
                                <span className="font-bold text-sm text-gray-800 group-hover:text-red-600 transition-colors">{cat.name}</span>
                                <div className="p-1 rounded-md text-gray-400 group-hover:text-red-600 transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Contact & Social */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" /> Connect
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3.5 shadow-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <a href="mailto:samacharbharatgzp@gmail.com" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors group">
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Email</p>
                                    <p className="font-semibold text-xs text-gray-700 truncate">samacharbharatgzp@gmail.com</p>
                                </div>
                            </a>
                            <a href="tel:+917347718098" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors group">
                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
                                    <p className="font-semibold text-xs text-gray-700">+91 734 771 8098</p>
                                </div>
                            </a>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex justify-center gap-4">
                            <a href="https://facebook.com" aria-label="Facebook" className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-blue-600 hover:text-white flex items-center justify-center text-gray-600 transition-all border border-gray-200">
                                <Share2 className="w-4 h-4" />
                            </a>
                            <a href="https://instagram.com" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-pink-600 hover:text-white flex items-center justify-center text-gray-600 transition-all border border-gray-200">
                                <Camera className="w-4 h-4" />
                            </a>
                            <a href="https://youtube.com" aria-label="YouTube" className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-600 hover:text-white flex items-center justify-center text-gray-600 transition-all border border-gray-200">
                                <Video className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Sign Out */}
                {user && (
                    <button
                        onClick={handleSignOut}
                        className="w-full py-2.5 bg-white border border-red-200 rounded-xl text-red-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-xs active:scale-[0.98]"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                )}

                {/* Footer simple */}
                <div className="text-center pt-2 space-y-1">
                    <p className="text-[10px] font-semibold text-gray-400 flex items-center justify-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500 inline fill-red-500" /> for Bharat
                    </p>
                    <p className="text-[9px] text-gray-400 font-medium">© 2026 SAMACHAR BHARAT NEWS PORTAL</p>
                </div>
            </main>
        </div>
    );
}
