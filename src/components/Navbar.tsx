'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { UserRole } from '@/types/auth.types';
import { fetchCategories } from '@/lib/firestore/categories';
import type { Category } from '@/types';
import {
    Menu,
    ShieldCheck,
    LogIn,
    UserPlus,
    PenTool,
    Crown,
    LogOut,
    ChevronDown,
    Radio,
    Bookmark,
} from 'lucide-react';

// ─── Default/Fallback Categories (shown until Firestore loads) ───────────────
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
const EDITOR_PANEL_ROLES: UserRole[] = [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.REPORTER];

function getPanelLink(role: UserRole | null, userEmail?: string | null): { href: string; label: string; icon: React.ReactNode } | null {
    const isOwnerEmail = userEmail === 'rkv3232@gmail.com' || userEmail === 'ckv3232@gmail.com';
    if (isOwnerEmail || (role && ADMIN_PANEL_ROLES.includes(role))) {
        return {
            href: '/admin',
            label: 'Admin Panel',
            icon: isOwnerEmail || role === UserRole.OWNER
                ? <Crown className="w-3.5 h-3.5" />
                : <ShieldCheck className="w-3.5 h-3.5" />,
        };
    }
    if (role === UserRole.REPORTER) {
        return {
            href: '/editor',
            label: 'Reporter Panel',
            icon: <PenTool className="w-3.5 h-3.5" />,
        };
    }
    if (role && EDITOR_PANEL_ROLES.includes(role)) {
        return {
            href: '/editor',
            label: 'Editor Panel',
            icon: <PenTool className="w-3.5 h-3.5" />,
        };
    }
    return null;
}

function RolePill({ role }: { role: UserRole }) {
    const config: Record<UserRole, { label: string; classes: string }> = {
        [UserRole.OWNER]: { label: 'Owner', classes: 'bg-amber-100 text-amber-800 border-amber-200' },
        [UserRole.ADMIN]: { label: 'Admin', classes: 'bg-red-100 text-red-800 border-red-200' },
        [UserRole.EDITOR]: { label: 'Editor', classes: 'bg-purple-100 text-purple-800 border-purple-200' },
        [UserRole.REPORTER]: { label: 'Reporter', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
        [UserRole.USER]: { label: 'User', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
    };
    const c = config[role] ?? config[UserRole.USER];
    return (
        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full border ${c.classes}`}>
            {c.label}
        </span>
    );
}

export default function Navbar() {
    const [userDropOpen, setUserDropOpen] = useState(false);
    const userDropRef = useRef<HTMLDivElement>(null);
    const [currentDate, setCurrentDate] = useState('');
    const [navCategories, setNavCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const pathname = usePathname();
    const router = useRouter();

    const { user, firestoreUser, role, loading, signOut } = useAuth();
    const { settings } = useSettings();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) {
                setUserDropOpen(false);
            }
        };
        if (userDropOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userDropOpen]);

    useEffect(() => {
        const locale = 'hi-IN';
        setCurrentDate(
            new Date().toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        );
    }, []);

    useEffect(() => {
        const CACHE_KEY = 'sb_categories_cache';
        const CACHE_TIME = 60 * 60 * 1000;

        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TIME) {
                    const defaultSlugs = new Set(DEFAULT_CATEGORIES.map((c) => c.slug));
                    const extraCats = data.filter((c: any) => !defaultSlugs.has(c.slug));
                    setNavCategories([...DEFAULT_CATEGORIES, ...extraCats]);
                    return;
                }
            }
        } catch {
            sessionStorage.removeItem(CACHE_KEY);
        }

        fetchCategories()
            .then((data) => {
                const defaultSlugs = new Set(DEFAULT_CATEGORIES.map((c) => c.slug));
                const extraCats = data.filter((c) => !defaultSlugs.has(c.slug));
                setNavCategories([...DEFAULT_CATEGORIES, ...extraCats]);

                try {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                        data,
                        timestamp: Date.now()
                    }));
                } catch {
                    // Ignore storage quota
                }
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        setUserDropOpen(false);
    }, [pathname]);

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/');
    };

    const panelLink = getPanelLink(role, user?.email);
    const showPanelButton = !loading && !!user && !!panelLink;
    const displayName = firestoreUser?.name ?? user?.email?.split('@')[0] ?? 'User';

    return (
        <header className="sticky top-0 z-40 w-full shadow-xs bg-white">
            {/* ── Top micro-bar ────────────────────────────────────────── */}
            <div className="bg-red-700 text-white text-[11px] py-1 px-4 flex justify-between items-center font-medium">
                <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[10px]">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    लाइव न्यूज़
                </span>
                <span id="navbar-date" className="text-[11px] font-medium opacity-90">{currentDate}</span>
            </div>

            {/* ── Brand + Auth Controls ───────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 group active:scale-[0.99] transition-transform">
                    <img
                        src="/logo.png"
                        alt="Samachar Bharat"
                        className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-xs"
                    />
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-none tracking-tight flex items-center gap-1">
                            <span className="text-red-600">SAMACHAR</span>
                            <span className="text-gray-900">BHARAT</span>
                        </h1>
                        <p className="text-[9px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">
                            {settings?.language === 'hi' ? "सत्य • सटीक • सबसे पहले" : "TRUTH • ACCURACY • FIRST"}
                        </p>
                    </div>
                </Link>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* NOT logged in */}
                    {!loading && !user && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Link
                                href="/login"
                                prefetch={true}
                                id="navbar-login-btn"
                                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>लॉगिन</span>
                            </Link>
                            <Link
                                href="/login?tab=signup"
                                prefetch={true}
                                id="navbar-signup-btn"
                                className="hidden sm:flex items-center gap-1.5 bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:bg-red-700 transition-all active:scale-95"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>नया खाता</span>
                            </Link>
                        </div>
                    )}

                    {/* Logged in */}
                    {!loading && user && (
                        <div className="flex items-center gap-2">
                            {showPanelButton && (
                                <Link
                                    href={panelLink!.href}
                                    id="navbar-panel-btn"
                                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95"
                                >
                                    {panelLink!.icon}
                                    <span className="hidden sm:inline">{panelLink!.label}</span>
                                    <span className="sm:hidden">Admin</span>
                                </Link>
                            )}

                            {/* User dropdown */}
                            <div ref={userDropRef} className="relative">
                                <button
                                    type="button"
                                    id="navbar-user-menu"
                                    onClick={() => setUserDropOpen(!userDropOpen)}
                                    className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-800 transition-colors active:scale-95"
                                >
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white text-[10px] font-black">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="max-w-[80px] sm:max-w-[120px] truncate">{displayName}</span>
                                    {role && <RolePill role={role} />}
                                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${userDropOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userDropOpen && (
                                    <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in duration-150">
                                        <div className="px-3 py-2 border-b border-gray-100">
                                            <p className="text-[10px] font-medium text-gray-400">Signed in as</p>
                                            <p className="text-xs font-bold text-gray-800 truncate">{user.email}</p>
                                        </div>
                                        {showPanelButton && (
                                            <Link
                                                href={panelLink!.href}
                                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                onClick={() => setUserDropOpen(false)}
                                            >
                                                {panelLink!.icon}
                                                {panelLink!.label}
                                            </Link>
                                        )}
                                        <Link
                                            href="/bookmarks"
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            onClick={() => setUserDropOpen(false)}
                                        >
                                            <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                                            Saved Articles
                                        </Link>
                                        <button
                                            type="button"
                                            id="navbar-signout-btn"
                                            onClick={handleSignOut}
                                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border-t border-gray-100 transition-colors"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile Menu Icon (Links to /menu) */}
                    <div className="flex md:hidden items-center">
                        <Link
                            href="/menu"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors active:scale-95"
                            aria-label="Menu"
                        >
                            <Menu className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Category Nav (Desktop Only — Light Mode & Compact) ──────── */}
            <nav className="bg-white border-b border-gray-200 hidden md:block">
                <div className="max-w-7xl mx-auto px-4">
                    <ul className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
                        <li>
                            <Link
                                href="/"
                                prefetch={true}
                                className={`block px-3.5 py-2 text-[13px] font-bold transition-all whitespace-nowrap border-b-2 active:scale-95 ${isActive('/')
                                    ? 'text-red-600 border-red-600 bg-red-50/50'
                                    : 'text-gray-700 hover:text-red-600 hover:bg-gray-50 border-transparent'
                                    }`}
                            >
                                होम
                            </Link>
                        </li>
                        {navCategories.map((cat: Category) => {
                            const path = `/category/${cat.slug}`;
                            const active = isActive(path);
                            return (
                                <li key={cat.slug}>
                                    <Link
                                        href={path}
                                        prefetch={true}
                                        className={`block px-3.5 py-2 text-[13px] font-bold transition-all whitespace-nowrap border-b-2 active:scale-95 ${active
                                            ? 'text-red-600 border-red-600 bg-red-50/50'
                                            : 'text-gray-700 hover:text-red-600 hover:bg-gray-50 border-transparent'
                                            }`}
                                    >
                                        {cat.name}
                                    </Link>
                                </li>
                            );
                        })}
                        <li className="ml-auto">
                            <Link
                                href="/live"
                                prefetch={true}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black transition-all bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs active:scale-95 my-1"
                            >
                                <Radio size={13} className="animate-pulse" /> LIVE TV
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* ── Mobile Category Nav (Scrollable — Light Mode & Compact) ─── */}
            <div className="md:hidden bg-white border-b border-gray-200 flex items-center gap-1 overflow-x-auto no-scrollbar px-2.5 py-1.5">
                <Link
                    href="/"
                    prefetch={true}
                    className={`block px-3 py-1 text-xs font-bold transition-all rounded-lg whitespace-nowrap active:scale-95 ${isActive('/')
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    होम
                </Link>
                {navCategories.slice(0, 6).map((cat: Category) => {
                    const path = `/category/${cat.slug}`;
                    const active = isActive(path);
                    return (
                        <Link
                            key={cat.slug}
                            href={path}
                            prefetch={true}
                            className={`block px-3 py-1 text-xs font-bold transition-all rounded-lg whitespace-nowrap active:scale-95 ${active
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {cat.name}
                        </Link>
                    );
                })}
                <Link
                    href="/menu"
                    prefetch={true}
                    className="block px-3 py-1 text-xs font-black text-red-600 rounded-lg whitespace-nowrap border border-red-200 bg-red-50 hover:bg-red-100 active:scale-95"
                >
                    सभी +
                </Link>
            </div>
        </header>
    );
}
