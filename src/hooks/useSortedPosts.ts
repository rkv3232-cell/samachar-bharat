import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/lib/posts';
import { SortOption } from '@/types/sorting';
import { SORT_CONFIGS } from '@/lib/queries';

export function useSortedPosts(initialSort: SortOption = 'latest', categoryFilter?: string) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState<SortOption>(initialSort);

    useEffect(() => {
        const fetchSortedPosts = async () => {
            setLoading(true);
            setError(null);

            try {
                const config = SORT_CONFIGS[sort];
                const constraints: QueryConstraint[] = [
                    orderBy(config.field, config.direction),
                    limit(20)
                ];

                if (categoryFilter) {
                    constraints.unshift(where('category', '==', categoryFilter));
                }

                const q = query(collection(db, 'posts'), ...constraints);
                const snapshot = await getDocs(q);

                const loadedPosts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Post[];

                // Filter out drafts on public frontend
                const publicPosts = loadedPosts.filter(p => !p.status || p.status === 'published');
                setPosts(publicPosts);
            } catch (err: any) {
                console.error("Firestore sorting error:", err);
                // Missing index errors usually contain a direct link to create them
                if (err.message.includes('index')) {
                    setError('Database index missing. Please check console for the link to create it.');
                } else {
                    setError(err.message || 'Failed to fetch sorted posts');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSortedPosts();
    }, [sort, categoryFilter]);

    return { posts, loading, error, sort, setSort };
}
