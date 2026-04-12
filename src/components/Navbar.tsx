'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { UserRole } from '@/types/auth.types';
import { fetchCategories } from '@/lib/firestore/categories';
import type { Category } from '@/types';
import {
    Menu,
    X,
    Newspaper,
    ShieldCheck,
    LogIn,
    UserPlus,
    PenTool,
    Crown,
    LogOut,
    ChevronDown,
    Radio,
    Bookmark,
    Users,
    Globe,
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

// Roles that can access the admin panel
const ADMIN_PANEL_ROLES: UserRole[] = [UserRole.OWNER, UserRole.ADMIN];

// Roles that can access the editor panel
const EDITOR_PANEL_ROLES: UserRole[] = [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.REPORTER];

// ─── Panel button config ──────────────────────────────────────────────────────

function getPanelLink(role: UserRole | null): { href: string; label: string; icon: React.ReactNode } | null {
    if (!role) return null;
    if (ADMIN_PANEL_ROLES.includes(role)) {
        return {
            href: '/admin',
            label: 'Admin Panel',
            icon: role === UserRole.OWNER
                ? <Crown className="w-4 h-4" />
                : <ShieldCheck className="w-4 h-4" />,
        };
    }
    if (role === UserRole.REPORTER) {
        return {
            href: '/editor',
            label: 'Reporter Panel',
            icon: <PenTool className="w-4 h-4" />,
        };
    }
    if (EDITOR_PANEL_ROLES.includes(role)) {
        return {
            href: '/editor',
            label: 'Editor Panel',
            icon: <PenTool className="w-4 h-4" />,
        };
    }
    return null;
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RolePill({ role }: { role: UserRole }) {
    const config: Record<UserRole, { label: string; classes: string }> = {
        [UserRole.OWNER]: { label: 'Owner', classes: 'bg-amber-100 text-amber-700' },
        [UserRole.ADMIN]: { label: 'Admin', classes: 'bg-red-100 text-red-700' },
        [UserRole.EDITOR]: { label: 'Editor', classes: 'bg-purple-100 text-purple-700' },
        [UserRole.REPORTER]: { label: 'Reporter', classes: 'bg-blue-100 text-blue-700' },
        [UserRole.USER]: { label: 'User', classes: 'bg-gray-100 text-gray-600' },
    };
    const c = config[role] ?? config[UserRole.USER];
    return (
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${c.classes}`}>
            {c.label}
        </span>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userDropOpen, setUserDropOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [navCategories, setNavCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const pathname = usePathname();
    const router = useRouter();

    const { user, firestoreUser, role, loading, signOut } = useAuth();
    const { settings } = useSettings();

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

    // Fetch dynamic categories from Firestore and MERGE with defaults
    useEffect(() => {
        const CACHE_KEY = 'sb_categories_cache';
        const CACHE_TIME = 60 * 60 * 1000; // 1 hour

        // Try load from sessionStorage first
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TIME) {
                    const defaultSlugs = new Set(DEFAULT_CATEGORIES.map((c) => c.slug));
                    const extraCats = data.filter((c: any) => !defaultSlugs.has(c.slug));
                    setNavCategories([...DEFAULT_CATEGORIES, ...extraCats]);
                    console.log('[Navbar] Categories loaded from cache');
                    return;
                }
            } catch (e) {
                sessionStorage.removeItem(CACHE_KEY);
            }
        }

        // Fetch if no cache or expired
        fetchCategories()
            .then((data) => {
                const defaultSlugs = new Set(DEFAULT_CATEGORIES.map((c) => c.slug));
                const extraCats = data.filter((c) => !defaultSlugs.has(c.slug));
                setNavCategories([...DEFAULT_CATEGORIES, ...extraCats]);

                // Save to cache
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            })
            .catch(() => { /* keep defaults on error */ });
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setMenuOpen(false);
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

    // Panel link calculated from role
    const panelLink = getPanelLink(role);

    // Only show panel button if role is one of the privileged roles
    const showPanelButton = !loading && !!user && !!panelLink;
    const displayName = firestoreUser?.name ?? user?.email?.split('@')[0] ?? 'User';

    const siteName = "SAMACHAR BHARAT";

    return (
        <header className="sticky top-0 z-50 w-full shadow-lg">
            {/* ── Top bar ─────────────────────────────────────────────── */}
            <div className="bg-red-700 text-white text-xs py-1 px-4 flex justify-between items-center bg-primary">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    लाइव न्यूज़
                </span>
                <span id="navbar-date">{currentDate}</span>
            </div>

            {/* ── Brand + Auth Controls ───────────────────────────────── */}
            <div className="bg-white border-b-2 border-red-600 px-4 py-3 flex items-center justify-between border-primary">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform bg-primary">
                        <Newspaper className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 leading-none tracking-tight">
                            <span className="text-red-600 text-primary">{siteName.toUpperCase().split(' ')[0]}</span>
                            {siteName.toUpperCase().split(' ').slice(1).join(' ')}
                        </h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{settings?.language === 'hi' ? "हिंदी समाचार" : "LATEST HINDI NEWS"}</p>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    {/* ── NOT logged in: show Login + Signup ── */}
                    {!loading && !user && (
                        <div className="hidden md:flex items-center gap-2">
                            <Link
                                href="/login"
                                id="navbar-login-btn"
                                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                                <LogIn className="w-4 h-4" />
                                Login
                            </Link>
                            <Link
                                href="/login?tab=signup"
                                id="navbar-signup-btn"
                                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition"
                            >
                                <UserPlus className="w-4 h-4" />
                                Signup
                            </Link>
                        </div>
                    )}

                    {/* ── Logged in: Panel button + User dropdown ── */}
                    {!loading && user && (
                        <div className="hidden md:flex items-center gap-2">
                            {/* Panel button — only for admin/editor-capable roles */}
                            {showPanelButton && (
                                <Link
                                    href={panelLink!.href}
                                    id="navbar-panel-btn"
                                    className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                >
                                    {panelLink!.icon}
                                    {panelLink!.label}
                                </Link>
                            )}

                            {/* User dropdown */}
                            <div className="relative">
                                <button
                                    id="navbar-user-menu"
                                    onClick={() => setUserDropOpen(!userDropOpen)}
                                    className="flex items-center gap-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="max-w-[100px] truncate">{displayName}</span>
                                    {role && <RolePill role={role} />}
                                    <ChevronDown className={`w-3 h-3 transition-transform ${userDropOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userDropOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-xs text-gray-500">Signed in as</p>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                                        </div>
                                        {showPanelButton && (
                                            <Link
                                                href={panelLink!.href}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                onClick={() => setUserDropOpen(false)}
                                            >
                                                {panelLink!.icon}
                                                {panelLink!.label}
                                            </Link>
                                        )}
                                        <Link
                                            href="/bookmarks"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-50"
                                            onClick={() => setUserDropOpen(false)}
                                        >
                                            <Bookmark className="w-4 h-4 text-blue-500" />
                                            Saved Articles
                                        </Link>
                                        <button
                                            id="navbar-signout-btn"
                                            onClick={handleSignOut}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Nav Actions (Mobile hamburger, Theme, Lang) */}
                    <div className="flex items-center gap-2">
                        <button
                            id="mobile-menu-toggle"
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition focus:outline-none"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X className="w-6 h-6 text-gray-800 dark:text-gray-200" /> : <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Category Nav (Desktop) ──────────────────────────────── */}
            <nav className="bg-gray-900 border-t border-gray-800 hidden md:block">
                <div className="max-w-7xl mx-auto px-4">
                    <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        <li>
                            <Link
                                href="/"
                                className={`block px-5 py-3.5 text-[15px] font-bold transition-all whitespace-nowrap border-b-2 ${isActive('/')
                                    ? 'bg-red-600 text-white border-red-500'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white border-transparent'
                                    }`}
                            >
                                होम
                            </Link>
                        </li>
                        {navCategories.map((cat: Category) => {
                            const path = `/category/${cat.slug}`;
                            return (
                                <li key={cat.slug}>
                                    <Link
                                        href={path}
                                        className={`block px-5 py-3.5 text-[15px] font-bold transition-all whitespace-nowrap border-b-2 ${isActive(path)
                                            ? 'bg-red-600 text-white border-red-500'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white border-transparent'
                                            }`}
                                    >
                                        {cat.name}
                                    </Link>
                                </li>
                            );
                        })}
                        <li>
                            <Link
                                href="/live"
                                className={`flex items-center gap-2 px-6 py-3.5 text-[15px] font-black transition-all whitespace-nowrap border-b-2 bg-red-700 text-white hover:bg-red-600 ${isActive('/live')
                                    ? 'border-white'
                                    : 'border-transparent'
                                    }`}
                            >
                                <Radio size={16} className="animate-pulse" />
                                LIVE TV
                            </Link>
                        </li>

                        <li className="shrink-0">
                            <Link
                                href="/explore"
                                className={`flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold transition-all whitespace-nowrap border-b-2 ${isActive('/explore')
                                    ? 'bg-red-600 text-white border-red-500'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white border-transparent'
                                    }`}
                            >
                                <Globe size={16} />
                                ग्लोबल न्यूज़
                            </Link>
                        </li>
                        {/* Right padding guard for scrolling */}
                        <li className="pr-4 shrink-0" aria-hidden="true"></li>
                    </ul>
                </div>
            </nav>

            {/* ── Mobile Drawer ───────────────────────────────────────── */}
            {menuOpen && (
                <nav className="md:hidden bg-gray-900 border-t border-gray-800 fixed left-0 right-0 bottom-0 top-[110px] z-50 shadow-2xl overflow-y-auto overscroll-contain pb-10">
                    <ul className="flex flex-col py-2">
                        <li>
                            <Link
                                href="/"
                                className={`block px-6 py-4 text-[15px] font-bold transition-all border-l-4 ${isActive('/')
                                    ? 'bg-red-600 text-white border-red-500'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white border-transparent'
                                    }`}
                                onClick={() => setMenuOpen(false)}
                            >
                                होम
                            </Link>
                        </li>
                        {navCategories.map((cat: Category) => {
                            const path = `/category/${cat.slug}`;
                            return (
                                <li key={cat.slug}>
                                    <Link
                                        href={path}
                                        className={`block px-6 py-4 text-[15px] font-bold transition-all border-l-4 ${isActive(path)
                                            ? 'bg-red-600 text-white border-red-500'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white border-transparent'
                                            }`}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {cat.name}
                                    </Link>
                                </li>
                            );
                        })}
                        <li>
                            <Link
                                href="/live"
                                className={`flex items-center gap-3 px-6 py-4 text-[15px] font-black transition-all border-l-4 bg-red-700 text-white ${isActive('/live')
                                    ? 'border-white'
                                    : 'border-transparent'
                                    }`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <Radio size={18} className="animate-pulse" />
                                LIVE TV
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/explore"
                                className={`flex items-center gap-3 px-6 py-4 text-[15px] font-bold transition-all border-l-4 ${isActive('/explore')
                                    ? 'bg-red-600 text-white border-red-500'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white border-transparent'
                                    }`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <Globe size={18} />
                                ग्लोबल न्यूज़
                            </Link>
                        </li>

                        {/* Mobile: Auth section at the bottom */}
                        <li className="border-t border-gray-700 mt-2 pt-2">
                            {!user ? (
                                <div className="flex flex-col gap-2 px-4 pb-3">
                                    <Link
                                        href="/login"
                                        className="flex items-center justify-center gap-2 border border-gray-500 text-gray-300 px-4 py-3 rounded-lg text-sm font-semibold"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Login
                                    </Link>
                                    <Link
                                        href="/login?tab=signup"
                                        className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg text-sm font-bold"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Signup
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1 px-4 pb-3">
                                    {/* User info */}
                                    <div className="flex items-center gap-2 py-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-semibold text-sm truncate">{displayName}</p>
                                            {role && <RolePill role={role} />}
                                        </div>
                                    </div>
                                    {/* Panel link */}
                                    {showPanelButton && (
                                        <Link
                                            href={panelLink!.href}
                                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg text-sm font-semibold"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            {panelLink!.icon}
                                            {panelLink!.label}
                                        </Link>
                                    )}
                                    <Link
                                        href="/bookmarks"
                                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg text-sm font-semibold"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <Bookmark className="w-4 h-4 text-blue-400" />
                                        Saved Articles
                                    </Link>
                                    {/* Sign out */}
                                    <button
                                        onClick={() => { handleSignOut(); setMenuOpen(false); }}
                                        className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-3 rounded-lg text-sm font-semibold text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </li>
                    </ul>
                </nav>
            )}
        </header>
    );
}
