'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TopLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Reset loader when pathname or search parameters change
    useEffect(() => {
        setProgress(100);
        const timer = setTimeout(() => {
            setLoading(false);
            setProgress(0);
        }, 200);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    // Intercept clicks on internal links for 0ms visual feedback
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a, button[data-nav]');
            if (!target) return;

            if (target.tagName.toLowerCase() === 'a') {
                const href = target.getAttribute('href');
                if (
                    !href ||
                    href.startsWith('#') ||
                    href.startsWith('mailto:') ||
                    href.startsWith('tel:') ||
                    target.getAttribute('target') === '_blank'
                ) {
                    return;
                }

                try {
                    const url = new URL(href, window.location.origin);
                    if (url.origin === window.location.origin && (url.pathname !== window.location.pathname || url.search !== window.location.search)) {
                        setLoading(true);
                        setProgress(35);
                        setTimeout(() => setProgress((p) => (p === 35 ? 70 : p)), 60);
                        setTimeout(() => setProgress((p) => (p === 70 ? 90 : p)), 200);
                    }
                } catch {
                    // Ignore URL parsing errors
                }
            } else {
                // Button with data-nav
                setLoading(true);
                setProgress(40);
                setTimeout(() => setProgress((p) => (p === 40 ? 80 : p)), 80);
            }
        };

        document.addEventListener('click', handleClick, { passive: true });
        return () => document.removeEventListener('click', handleClick);
    }, []);

    if (!loading && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] pointer-events-none overflow-hidden"
            aria-hidden="true"
        >
            <div
                className="h-full bg-red-600 transition-all duration-200 ease-out shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                style={{
                    width: `${progress}%`,
                    opacity: progress === 100 ? 0 : 1,
                    transition: progress === 100 ? 'width 100ms ease-out, opacity 150ms ease-in' : 'width 250ms ease-out',
                }}
            />
        </div>
    );
}
