import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc,
    setDoc,
    Timestamp,
    getCountFromServer,
} from "firebase/firestore";
import type {
    DateFilter,
    AnalyticsData,
    AnalyticsOverview,
    Post,
    Comment,
    ChartDataPoint,
    SiteSettings,
    LiveStatus,
} from "@/types";

// ──────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────

function getStartDate(filter: DateFilter): Date {
    const now = new Date();
    switch (filter) {
        case "today":
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        case "7days":
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "30days":
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
}

function getDayCount(filter: DateFilter): number {
    switch (filter) {
        case "today":
            return 1;
        case "7days":
            return 7;
        case "30days":
            return 30;
    }
}

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

function buildEmptyDays(filter: DateFilter): Record<string, number> {
    const start = getStartDate(filter);
    const days = getDayCount(filter);
    const map: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
        const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        map[formatDate(d)] = 0;
    }
    return map;
}

// ──────────────────────────────────────────────
//  ANALYTICS QUERIES
// ──────────────────────────────────────────────

export async function fetchAnalytics(
    filter: DateFilter
): Promise<AnalyticsData> {
    const startDate = getStartDate(filter);
    const startTs = Timestamp.fromDate(startDate);

    // ── Pre-aggregated Stats (New: Scalability Fix) ──
    const statsRef = doc(db, "stats", "global");
    const statsSnap = await getDoc(statsRef);
    const globalStats = statsSnap.exists() ? statsSnap.data() : null;

    // ── Overview counts ──
    const [postsCount, usersCount, commentsCount] = await Promise.all([
        getCountFromServer(collection(db, "posts")),
        getCountFromServer(collection(db, "users")),
        getCountFromServer(collection(db, "comments")),
    ]);

    // ── Total Views & Read Time Calculation (Optimization) ──
    let totalViews = globalStats?.totalViews || 0;
    let totalWordCount = globalStats?.totalWordCount || 0;

    // If no aggregated stats, fall back to limited scan (Performance failsafe)
    const allPosts: Post[] = [];
    if (!globalStats) {
        // Only fetch top 500 posts for analytical modeling if global stats are missing
        const q = query(collection(db, "posts"), limit(500));
        const allPostsSnap = await getDocs(q);
        allPostsSnap.forEach((d) => {
            const data = d.data();
            if (!globalStats) {
                totalViews += data.views || 0;
                const content = (data.content || "").replace(/<[^>]+>/g, "");
                totalWordCount += content.split(/\s+/).length;
            }
            allPosts.push({ id: d.id, ...data } as Post);
        });
    }

    const avgReadTime = allPosts.length > 0 || globalStats
        ? Math.round((totalWordCount / (allPosts.length || 1) / 200) * 10) / 10
        : 0;

    const overview: AnalyticsOverview = {
        totalPosts: postsCount.data().count,
        totalUsers: usersCount.data().count,
        totalComments: commentsCount.data().count,
        totalViews: totalViews || 0,
        avgReadTime,
        topLocation: globalStats?.topLocation || "Uttar Pradesh",
    };

    // ── Top Categories ──
    const categoryLabels: Record<string, string> = {
        'uttar-pradesh': 'उत्तर प्रदेश',
        'desh': 'देश',
        'videsh': 'विदेश',
        'karobar': 'कारोबार',
        'crime': 'क्राइम',
        'dharm': 'धर्म',
        'rajniti': 'राजनीति',
        'lifestyle': 'लाइफस्टाइल',
    };

    const categoryMap: Record<string, number> = {};
    allPosts.forEach(p => {
        if (p.category) {
            const label = categoryLabels[p.category] || p.category;
            categoryMap[label] = (categoryMap[label] || 0) + (p.views || 0);
        }
    });
    const topCategories = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // ── Daily Distribution (Hourly) ──
    const hourlyViews = Array.from({ length: 24 }).fill(0) as number[];
    allPosts.forEach(p => {
        if (p.createdAt) {
            const hour = p.createdAt.toDate().getHours();
            hourlyViews[hour] += (p.views || 0);
        }
    });

    const dailyDistribution = hourlyViews.map((views, i) => ({
        hour: `${i}:00`,
        views
    }));

    // ── Trending posts (top 5) ──
    const trendingQ = query(
        collection(db, "posts"),
        orderBy("views", "desc"),
        limit(5)
    );
    const trendingSnap = await getDocs(trendingQ);
    const trendingPosts = trendingSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Post)
    );

    // ── Recent posts ──
    const recentPostsQ = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(5)
    );
    const recentPostsSnap = await getDocs(recentPostsQ);
    const recentPosts = recentPostsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Post)
    );

    // ── Recent comments ──
    const recentCommentsQ = query(
        collection(db, "comments"),
        orderBy("createdAt", "desc"),
        limit(5)
    );
    let recentComments: Comment[] = [];
    try {
        const recentCommentsSnap = await getDocs(recentCommentsQ);
        recentComments = recentCommentsSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as Comment)
        );
    } catch (e) { /* Collections might be missing on root */ }

    // ── Daily views chart ──
    const filteredPostsQ = query(
        collection(db, "posts"),
        where("createdAt", ">=", startTs),
        orderBy("createdAt", "asc")
    );
    const filteredPostsSnap = await getDocs(filteredPostsQ);
    const viewsMap = buildEmptyDays(filter);
    filteredPostsSnap.forEach((d) => {
        const data = d.data();
        const key = formatDate(data.createdAt.toDate());
        if (viewsMap[key] !== undefined) {
            viewsMap[key] += data.views || 0;
        }
    });
    const dailyViews: ChartDataPoint[] = Object.entries(viewsMap).map(
        ([date, value]) => ({ date, value })
    );

    // ── Posts created chart ──
    const postsCreatedMap = buildEmptyDays(filter);
    filteredPostsSnap.forEach((d) => {
        const key = formatDate(d.data().createdAt.toDate());
        if (postsCreatedMap[key] !== undefined) {
            postsCreatedMap[key] += 1;
        }
    });
    const postsCreated: ChartDataPoint[] = Object.entries(postsCreatedMap).map(
        ([date, value]) => ({ date, value })
    );

    // ── User growth chart ──
    const usersQ = query(
        collection(db, "users"),
        where("createdAt", ">=", startTs),
        orderBy("createdAt", "asc")
    );
    const usersSnap = await getDocs(usersQ);
    const userMap = buildEmptyDays(filter);
    usersSnap.forEach((d) => {
        const key = formatDate(d.data().createdAt.toDate());
        if (userMap[key] !== undefined) {
            userMap[key] += 1;
        }
    });
    const userGrowth: ChartDataPoint[] = Object.entries(userMap).map(
        ([date, value]) => ({ date, value })
    );

    return {
        overview,
        trendingPosts,
        dailyViews,
        postsCreated,
        userGrowth,
        recentPosts,
        recentComments,
        topCategories,
        dailyDistribution
    };
}

// ──────────────────────────────────────────────
//  SETTINGS QUERIES
// ──────────────────────────────────────────────

const SETTINGS_REF = doc(db, "settings", "global");
const LIVE_REF = doc(db, "settings", "live");

export const DEFAULT_SETTINGS: SiteSettings = {
    siteName: "NEWS PORTAL",
    logoUrl: "",
    theme: "light",
    language: "hi",
    contactEmail: "samacharbharatgzp@gmail.com",
    facebookUrl: "https://www.facebook.com/profile.php?id=100083988045915&sk=directory_intro",
    instagramUrl: "https://www.instagram.com/news_bharat_301",
    primaryColor: "#dc2626",
    autoSave: false,
};

export const DEFAULT_LIVE_STATUS: LiveStatus = {
    isActive: true,
    streamUrl: "uMs4VVia3Pg", // ABP News as main
    title: "LIVE TV: Breaking News",
    provider: "youtube",
    channels: [
        { id: "1", title: "ABP News", streamUrl: "uMs4VVia3Pg", provider: "youtube", isActive: true },
        { id: "2", title: "Aaj Tak", streamUrl: "Nq2wYlWFucg", provider: "youtube", isActive: true },
        { id: "3", title: "NDTV India", streamUrl: "MN8p-Vrn6G0", provider: "youtube", isActive: true },
        { id: "4", title: "Republic Bharat", streamUrl: "ppsf235_N_U", provider: "youtube", isActive: true },
        { id: "5", title: "News18 India", streamUrl: "qY8L6O07XmU", provider: "youtube", isActive: true },
    ]
};

export async function fetchSettings(): Promise<SiteSettings> {
    const snap = await getDoc(SETTINGS_REF);
    if (snap.exists()) {
        return { ...DEFAULT_SETTINGS, ...snap.data() } as SiteSettings;
    }
    // Don't create default doc here, as it requires write permission
    // Only owner can create it
    return DEFAULT_SETTINGS;
}

export async function saveSettings(
    settings: Partial<SiteSettings>
): Promise<void> {
    await setDoc(SETTINGS_REF, settings, { merge: true });
}

export async function resetSettings(): Promise<void> {
    await setDoc(SETTINGS_REF, DEFAULT_SETTINGS);
}

// ─── Live Telecast Queries ───

export async function fetchLiveStatus(): Promise<LiveStatus> {
    const snap = await getDoc(LIVE_REF);
    if (snap.exists()) {
        return { ...DEFAULT_LIVE_STATUS, ...snap.data() } as LiveStatus;
    }
    // Don't create default doc
    return DEFAULT_LIVE_STATUS;
}

export async function saveLiveStatus(
    status: Partial<LiveStatus>
): Promise<void> {
    await setDoc(LIVE_REF, status, { merge: true });
}
