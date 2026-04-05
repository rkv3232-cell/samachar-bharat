// ============================================================
// components/admin/ui/LoadingSpinner.tsx
// Centered loading spinner with optional message
// ============================================================

interface LoadingSpinnerProps {
    message?: string;
}

export default function LoadingSpinner({
    message = "Loading...",
}: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">{message}</p>
        </div>
    );
}
