"use client";

import Link from 'next/link';
import { Newspaper, Mail, Phone, ShieldCheck, Send, Globe, Radio, MessageSquare, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { UserRole } from '@/types/auth.types';
import { fetchCategories } from '@/lib/firestore/categories';

const DEFAULT_CATEGORIES = [
    { name: 'उत्तर प्रदेश', slug: 'uttar-pradesh' },
    { name: 'देश', slug: 'desh' },
    { name: 'विदेश', slug: 'videsh' },
    { name: 'कारोबार', slug: 'karobar' },
    { name: 'क्राइम', slug: 'crime' },
    { name: 'धर्म', slug: 'dharm' },
    { name: 'राजनीति', slug: 'rajniti' },
    { name: 'लाइफस्टाइल', slug: 'lifestyle' },
];


export default function Footer() {
    const { user, role, isAdmin, isEditor, isReporter, isOwner, loading } = useAuth();
    const { settings } = useSettings();
    const [email, setEmail] = useState("");
    const [footerCats, setFooterCats] = useState(DEFAULT_CATEGORIES);
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    useEffect(() => {
        const CACHE_KEY = 'sb_categories_cache';
        const loadCats = async () => {
            // Check cache first
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const { data } = JSON.parse(cached);
                    const defaultSlugs = new Set(DEFAULT_CATEGORIES.map(c => c.slug));
                    const extra = data.filter((c: any) => !defaultSlugs.has(c.slug));
                    setFooterCats([...DEFAULT_CATEGORIES, ...extra]);
                    return;
                } catch (e) {
                    sessionStorage.removeItem(CACHE_KEY);
                }
            }

            try {
                const fetched = await fetchCategories();
                const defaultSlugs = new Set(DEFAULT_CATEGORIES.map(c => c.slug));
                const extra = fetched.filter(c => !defaultSlugs.has(c.slug));
                setFooterCats([...DEFAULT_CATEGORIES, ...extra]);

                // Cache for next time
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: fetched,
                    timestamp: Date.now()
                }));
            } catch (err) {
                console.error("Footer categories fetch failed");
            }
        };
        loadCats();
    }, []);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            alert("Thank you for subscribing! (Daily AI Newsletter is coming soon)");
            setEmail("");
        }
    };

    // Roles allowed to see the panel button (Inconsistent roles fixed)
    const hasPanelAccess = !loading && user && (isOwner || isAdmin || isEditor || isReporter);

    return (
        <footer className="bg-gray-900 text-white mt-16">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                                <Newspaper className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold uppercase tracking-tight"><span className="text-red-500">SAMACHAR</span> BHARAT</h2>
                                <p className="text-xs text-gray-400">हिंदी समाचार</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            भारत की ताज़ा खबरें, राजनीति, खेल, मनोरंजन और अधिक। हम आपको सबसे तेज़ और सटीक समाचार देते हैं।
                        </p>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-red-400">श्रेणियाँ</h3>
                        <ul className="grid grid-cols-2 gap-2">
                            {footerCats.map((cat) => (
                                <li key={cat.slug}>
                                    <Link
                                        href={`/category/${cat.slug}`}
                                        className="text-gray-400 hover:text-red-400 transition text-sm"
                                    >
                                        › {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-red-400">संपर्क करें</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-red-400" />
                                <span>samacharbharatgzp@gmail.com</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-red-400" />
                                <span>+91 734 771 8098</span>
                            </li>
                        </ul>

                        {/* ── Admin Panel Link (Protected) ── */}
                        {hasPanelAccess && (
                            <div className="mt-6 pt-4 border-t border-gray-800">
                                <Link
                                    href={isAdmin ? "/admin" : "/editor"}
                                    className="flex items-center gap-2 w-fit bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-900/50 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {isAdmin ? "Admin Panel" : (role === UserRole.REPORTER ? "Reporter Panel" : "Editor Panel")}
                                </Link>
                                <p className="text-[10px] text-gray-500 mt-2 italic">
                                    Logged in as: <span className="text-gray-400">{role}</span>
                                </p>
                            </div>
                        )}

                        <div className="mt-8 space-y-6">
                            {/* Quick Action Buttons */}
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold mb-3">त्वरित कार्रवाई (Quick Actions)</p>
                                <div className="flex gap-3">
                                    <Link href="/" title="Home" className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-300 group">
                                        <Globe size={18} className="text-gray-400 group-hover:text-white" />
                                    </Link>
                                    <Link href="/live" title="Live TV" className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-300 group">
                                        <Radio size={18} className="text-gray-400 group-hover:text-white" />
                                    </Link>
                                    <a href="mailto:samacharbharatgzp@gmail.com" title="Contact Us" className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-300 group">
                                        <MessageSquare size={18} className="text-gray-400 group-hover:text-white" />
                                    </a>
                                    <Link href="/bookmarks" title="Bookmarks" className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-300 group">
                                        <Heart size={18} className="text-gray-400 group-hover:text-white" />
                                    </Link>
                                </div>
                            </div>

                            {/* Social Media Buttons */}
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold mb-3">सोशल मीडिया (Social Media)</p>
                                <div className="flex gap-3">
                                    <a href={settings?.facebookUrl || "https://www.facebook.com/profile.php?id=100083988045915&sk=directory_intro"} target="_blank" rel="noopener noreferrer" title="Facebook" className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 group">
                                        <Facebook size={18} className="text-gray-400 group-hover:text-white" />
                                    </a>
                                    <a href={settings?.instagramUrl || "https://www.instagram.com/news_bharat_301"} target="_blank" rel="noopener noreferrer" title="Instagram" className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-pink-600 hover:border-pink-600 transition-all duration-300 group">
                                        <Instagram size={18} className="text-gray-400 group-hover:text-white" />
                                    </a>
                                    <a href="https://www.youtube.com/@samachar-bharatgzp" target="_blank" rel="noopener noreferrer" title="YouTube" className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-300 group">
                                        <Youtube size={18} className="text-gray-400 group-hover:text-white" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Newsletter Section */}
                <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-red-600/10 to-transparent border border-red-900/20 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            📧 AI Daily Newsletter
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">Get the most important news of the last 24 hours delivered to your inbox.</p>
                    </div>
                    <form onSubmit={handleSubscribe} className="w-full md:w-auto flex gap-3">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your Email"
                            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                        <button className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 flex items-center gap-2 transition-all shrink-0">
                            <Send size={16} />
                            Subscribe
                        </button>
                    </form>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500 text-sm">
                    © {year || '...'} Samachar Bharat. All rights reserved. | हिंदी समाचार
                </div>
            </div>
        </footer>
    );
}

const Facebook = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const Instagram = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

const Youtube = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
);
