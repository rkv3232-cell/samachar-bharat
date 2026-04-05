'use client';

import { useEffect, useState } from 'react';
import { fetchCategories } from '@/lib/firestore/categories';

const DEFAULT_CATEGORIES: Record<string, string> = {
    'uttar-pradesh': 'उत्तर प्रदेश',
    'desh': 'देश',
    'videsh': 'विदेश',
    'karobar': 'कारोबार',
    'crime': 'क्राइम',
    'dharm': 'धर्म',
    'rajniti': 'राजनीति',
    'lifestyle': 'लाइफस्टाइल',
};

// Simple global cache to avoid refetching for every NewsCard
let cachedMap: Record<string, string> | null = null;
let pendingPromise: Promise<Record<string, string>> | null = null;

export default function CategoryLabel({ slug, className }: { slug: string; className?: string }) {
    const [label, setLabel] = useState(DEFAULT_CATEGORIES[slug] || slug);

    useEffect(() => {
        if (cachedMap) {
            setLabel(cachedMap[slug] || slug);
            return;
        }

        const load = async () => {
            if (!pendingPromise) {
                pendingPromise = fetchCategories().then(cats => {
                    const map: Record<string, string> = { ...DEFAULT_CATEGORIES };
                    cats.forEach(c => map[c.slug] = c.name);
                    cachedMap = map;
                    return map;
                });
            }
            const map = await pendingPromise;
            setLabel(map[slug] || slug);
        };

        load();
    }, [slug]);

    return <span className={className}>{label}</span>;
}
