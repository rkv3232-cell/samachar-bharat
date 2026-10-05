export default function ExploreLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
                <div className="skeleton h-7 w-32 rounded-md" />
            </div>

            <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 animate-pulse">
                <div className="h-28 bg-red-100/50 rounded-2xl mb-8 p-6 flex flex-col justify-center">
                    <div className="skeleton h-6 w-48 rounded mb-2" />
                    <div className="skeleton h-4 w-72 rounded" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 h-28 flex flex-col justify-between">
                            <div className="skeleton w-8 h-8 rounded-lg" />
                            <div className="skeleton h-4 w-20 rounded" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
