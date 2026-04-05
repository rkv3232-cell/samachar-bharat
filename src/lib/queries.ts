import { collection, query, orderBy, limit, DocumentData, Query } from 'firebase/firestore';
import { db } from './firebase';
import { SortOption, SortConfig } from '@/types/sorting';

export const SORT_CONFIGS: Record<SortOption, SortConfig> = {
    'latest': { id: 'latest', field: 'createdAt', direction: 'desc', label: 'Latest First' },
    'oldest': { id: 'oldest', field: 'createdAt', direction: 'asc', label: 'Oldest First' },
    'most-viewed': { id: 'most-viewed', field: 'views', direction: 'desc', label: 'Most Viewed' },
    'most-liked': { id: 'most-liked', field: 'likes', direction: 'desc', label: 'Most Liked' },
    'a-z': { id: 'a-z', field: 'title', direction: 'asc', label: 'Alphabetical (A-Z)' },
    'z-a': { id: 'z-a', field: 'title', direction: 'desc', label: 'Reverse Alphabetical (Z-A)' },
};

/**
 * Helper to build a sorted query for posts.
 * Note: These queries will require composite indexes in Firestore if combined with 'where' clauses.
 */
export function buildSortedPostsQuery(sortId: SortOption, limitCount: number = 20): Query<DocumentData> {
    const config = SORT_CONFIGS[sortId];
    if (!config) throw new Error(`Invalid sort option: ${sortId}`);

    return query(
        collection(db, 'posts'),
        orderBy(config.field, config.direction),
        limit(limitCount)
    );
}

/**
 * Use this to output required composite indexes for Firestore rules matching these queries
 */
export const requiredFirestoreIndexesHelp = `
/* 
To support these sorts along with 'where("category", "==", "xxx")' queries,
you will need to create the following composite indexes in Firebase Console:
Collection: posts
- field: category (ASC), field: createdAt (DESC) -> Latest First in Category
- field: category (ASC), field: createdAt (ASC) -> Oldest First in Category
- field: category (ASC), field: views (DESC) -> Most Viewed in Category
- field: category (ASC), field: likes (DESC) -> Most Liked in Category
- field: category (ASC), field: title (ASC) -> A-Z in Category
- field: category (ASC), field: title (DESC) -> Z-A in Category
*/
`;
