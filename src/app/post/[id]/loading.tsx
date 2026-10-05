export default function PostLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header skeleton */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
                <div className="skeleton h-7 w-32 rounded-md" />
            </div>

            <main className="max-w-4xl mx-auto px-4 py-6 w-full flex-1 animate-pulse">
                {/* Back link & Category pill */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="skeleton h-5 w-16 rounded" />
                    <div className="skeleton h-5 w-24 rounded-full" />
                </div>

                {/* Post Title skeleton */}
                <div className="skeleton h-8 w-11/12 rounded-lg mb-3" />
                <div className="skeleton h-7 w-4/5 rounded-lg mb-5" />

                {/* Author & Timestamp meta */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200 mb-6">
                    <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                        <div className="skeleton h-3.5 w-32 rounded" />
                        <div className="skeleton h-3 w-24 rounded" />
                    </div>
                </div>

                {/* Main Image skeleton */}
                <div className="skeleton w-full h-64 sm:h-80 md:h-[400px] rounded-2xl mb-8" />

                {/* Body paragraph skeletons */}
                <div className="space-y-3.5 max-w-3xl">
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-11/12 rounded" />
                    <div className="skeleton h-4 w-4/5 rounded" />
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-10/12 rounded" />
                    <div className="skeleton h-4 w-3/4 rounded" />
                </div>
            </main>
        </div>
    );
}
