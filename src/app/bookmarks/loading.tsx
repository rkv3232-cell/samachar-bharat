export default function BookmarksLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
                <div className="skeleton h-7 w-32 rounded-md" />
            </div>

            <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 animate-pulse">
                <div className="skeleton h-8 w-44 rounded-lg mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-3.5 flex flex-col gap-3">
                            <div className="skeleton h-40 w-full rounded-lg" />
                            <div className="skeleton h-4 w-3/4 rounded mt-1" />
                            <div className="skeleton h-4 w-full rounded" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
