'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Next.js Global Error Caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">कुछ समस्या आ रही है</h2>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                    सर्वर से जानकारी प्राप्त करने में परेशानी हो रही है। कृपया अपना इंटरनेट कनेक्शन जांचें और फिर से प्रयास करें।
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl transition w-full flex items-center justify-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        पुनः प्रयास करें
                    </button>
                    <Link
                        href="/"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-4 rounded-xl transition w-full flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        होमपेज पर जाएँ
                    </Link>
                </div>
            </div>
        </div>
    );
}
