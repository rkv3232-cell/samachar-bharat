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

import ThemeToggle from '@/components/ThemeToggle';

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

function getPanelLink(role: UserRole | null, userEmail?: string | null): { href: string; label: string; icon: React.ReactNode } | null {
    const isOwnerEmail = userEmail === 'rkv3232@gmail.com' || userEmail === 'ckv3232@gmail.com';
    if (isOwnerEmail || (role && ADMIN_PANEL_ROLES.includes(role))) {
        return {
            href: '/admin',
            label: 'Admin Panel',
            icon: isOwnerEmail || role === UserRole.OWNER
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
    if (role && EDITOR_PANEL_ROLES.includes(role)) {
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

    // Panel link calculated from role or owner email
    const panelLink = getPanelLink(role, user?.email);

    // Only show panel button if role/email is one of the privileged roles
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
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <img
                            src="/logo.png"
                            alt="Samachar Bharat"
                            className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
                        />
                        <div className="absolute inset-0 bg-red-600/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 leading-none tracking-tighter flex items-center gap-1">
                            <span className="text-red-600">SAMACHAR</span>
                            <span className="text-gray-900">BHARAT</span>
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase mt-1 opacity-90">
                            {settings?.language === 'hi' ? "सत्य • सटीक • सबसे पहले" : "TRUTH • ACCURACY • FIRST"}
                        </p>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {/* ── NOT logged in: show Login + Signup ── */}
                    {!loading && !user && (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                id="navbar-login-btn"
                                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                            >
                                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Login
                            </Link>
                            <Link
                                href="/login?tab=signup"
                                id="navbar-signup-btn"
                                className="hidden sm:flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition"
                            >
                                <UserPlus className="w-4 h-4" />
                                Signup
                            </Link>
                        </div>
                    )}

                    {/* ── Logged in: Panel button + User dropdown ── */}
                    {!loading && user && (
                        <div className="flex items-center gap-2">
                            {/* Panel button — only for admin/editor-capable roles */}
                            {showPanelButton && (
                                <Link
                                    href={panelLink!.href}
                                    id="navbar-panel-btn"
                                    className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors shadow-sm"
                                >
                                    {panelLink!.icon}
                                    <span className="hidden sm:inline">{panelLink!.label}</span>
                                    <span className="sm:hidden">Admin</span>
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

                    {/* Mobile Menu Icon (Links to /menu) */}
                    <div className="flex md:hidden items-center gap-2">
                        <Link
                            href="/menu"
                            className="p-2 rounded-lg hover:bg-gray-100 transition focus:outline-none"
                            aria-label="Menu"
                        >
                            <Menu className="w-6 h-6 text-gray-800" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Category Nav (Desktop Only) ─────────────────────────── */}
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
                            <Link href="/live" className="flex items-center gap-2 px-6 py-3.5 text-[15px] font-black transition-all bg-red-700 text-white">
                                <Radio size={16} className="animate-pulse" /> LIVE TV
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* ── Mobile Category Nav (Scrollable) ─────────────────── */}
            <div className="md:hidden bg-gray-900 border-t border-gray-800 flex items-center gap-1 overflow-x-auto no-scrollbar px-2 py-2">
                <Link
                    href="/"
                    className={`block px-4 py-2 text-[13px] font-bold transition-all rounded-lg whitespace-nowrap ${isActive('/')
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    होम
                </Link>
                {navCategories.slice(0, 6).map((cat: Category) => {
                    const path = `/category/${cat.slug}`;
                    return (
                        <Link
                            key={cat.slug}
                            href={path}
                            className={`block px-4 py-2 text-[13px] font-bold transition-all rounded-lg whitespace-nowrap ${isActive(path)
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {cat.name}
                        </Link>
                    );
                })}
                <Link
                    href="/menu"
                    className="block px-4 py-2 text-[13px] font-black text-red-500 rounded-lg whitespace-nowrap border border-red-500/30 bg-red-500/10"
                >
                    सभी +
                </Link>
            </div>
        </header>
    );
}
