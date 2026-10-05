"use client";

import Link from "next/link";
import { ShieldCheck, Radio, Bookmark, Compass, Heart } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-16 pb-12 pt-10 text-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-100">
                    {/* Brand */}
                    <div className="md:col-span-2 space-y-3">
                        <Link href="/" className="inline-block">
                            <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                                SAMACHAR <span className="text-red-600">BHARAT</span>
                            </span>
                        </Link>
                        <p className="text-sm text-gray-600 max-w-md leading-relaxed">
                            भारत का सबसे विश्वसनीय डिजिटल समाचार पोर्टल। ताज़ा खबरें, राजनीति, व्यापार, खेल और मनोरंजन की सटीक और निष्पक्ष कवरेज।
                        </p>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                            सत्य • सटीक • सबसे पहले
                        </p>
                    </div>

                    {/* Quick Navigation */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">त्वरित लिंक</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-gray-600 hover:text-red-600 transition-colors">
                                    होम (Home)
                                </Link>
                            </li>
                            <li>
                                <Link href="/live" className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1.5">
                                    <Radio size={14} className="text-red-600" /> लाइव प्रसारण (Live TV)
                                </Link>
                            </li>
                            <li>
                                <Link href="/explore" className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1.5">
                                    <Compass size={14} className="text-blue-600" /> एक्सप्लोर हब (Explore)
                                </Link>
                            </li>
                            <li>
                                <Link href="/bookmarks" className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1.5">
                                    <Bookmark size={14} className="text-amber-600" /> सेव की गई खबरें (Bookmarks)
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Verification & Trust */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">सत्यापन व सुरक्षा</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/verify-press-id/check" className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-emerald-600" /> प्रेस कार्ड सत्यापन (DPIVS)
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-gray-600 hover:text-red-600 transition-colors">
                                    संपादक / रिपोर्टर लॉगिन
                                </Link>
                            </li>
                            <li>
                                <Link href="/menu" className="text-gray-600 hover:text-red-600 transition-colors">
                                    सभी श्रेणियां (Categories)
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
                    <p>© {new Date().getFullYear()} SAMACHAR BHARAT. सर्वाधिकार सुरक्षित।</p>
                    <p className="flex items-center gap-1 text-gray-500">
                        Made with <Heart size={12} className="text-red-600 fill-current" /> for Indian Journalism
                    </p>
                </div>
            </div>
        </footer>
    );
}
