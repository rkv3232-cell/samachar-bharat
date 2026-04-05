// ============================================================
// components/posts/CategorySelect.tsx
// Dropdown to select a category when creating/editing a post
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { fetchCategories } from "@/lib/firestore/categories";
import type { Category } from "@/types";

interface CategorySelectProps {
    value: string;
    onChange: (categoryId: string) => void;
    label?: string;
    required?: boolean;
}

export default function CategorySelect({
    value,
    onChange,
    label = "Category",
    required = false,
}: CategorySelectProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch (error) {
                console.error("Failed to load categories:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div>
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={loading}
                required={required}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-50"
            >
                <option value="">
                    {loading ? "Loading categories..." : "Select a category"}
                </option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
