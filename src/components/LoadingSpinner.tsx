export default function LoadingSpinner({ text = 'लोड हो रहा है...' }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-red-100" />
                <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 text-sm font-medium">{text}</p>
        </div>
    );
}
