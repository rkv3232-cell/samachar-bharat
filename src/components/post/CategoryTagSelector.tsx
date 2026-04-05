"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchAllCategories } from "@/lib/services/categoryService";
import { fetchAllTags } from "@/lib/services/tagService";
import { Category, Tag } from "@/types/admin";

interface CategoryTagSelectorProps {
    selectedCategory: string;
    selectedTags: string[];
    onCategoryChange: (categoryId: string) => void;
    onTagsChange: (tagIds: string[]) => void;
}

export default function CategoryTagSelector({
    selectedCategory,
    selectedTags,
    onCategoryChange,
    onTagsChange,
}: CategoryTagSelectorProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagSearch, setTagSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchAllCategories().then(setCategories).catch(console.error);
        fetchAllTags().then(setTags).catch(console.error);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const availableTags = tags.filter(
        (t) =>
            !selectedTags.includes(t.name) && // The backend usually expects tags by string, but let's just stick to the snippet
            t.name.toLowerCase().includes(tagSearch.toLowerCase())
    );

    return (
        <div className="space-y-5">
            {/* ── Category Dropdown ── */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category
                </label>
                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                >
                    <option value="">— Select category —</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* ── Tags Multi-Select ── */}
            <div ref={dropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tags
                </label>
                <div className="border border-gray-200 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
                    {/* Selected tags */}
                    {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {selectedTags.map((tagName) => {
                                return (
                                    <span
                                        key={tagName}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold ring-1 ring-blue-200/60"
                                    >
                                        #{tagName}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onTagsChange(
                                                    selectedTags.filter((name) => name !== tagName)
                                                )
                                            }
                                            className="text-blue-400 hover:text-red-500 transition-colors ml-0.5"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Search input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={tagSearch}
                            onChange={(e) => {
                                setTagSearch(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && tagSearch.trim() && !selectedTags.includes(tagSearch.trim())) {
                                    e.preventDefault();
                                    onTagsChange([...selectedTags, tagSearch.trim()]);
                                    setTagSearch("");
                                    setShowDropdown(false);
                                }
                            }}
                            placeholder={
                                selectedTags.length > 0
                                    ? "Add more tags..."
                                    : "Search and select tags..."
                            }
                            className="w-full px-2 py-1.5 text-sm focus:outline-none bg-transparent"
                        />

                        {/* Dropdown */}
                        {showDropdown && availableTags.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto">
                                {availableTags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => {
                                            onTagsChange([...selectedTags, tag.name]);
                                            setTagSearch("");
                                            setShowDropdown(false);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <span className="text-gray-400">#</span>
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {showDropdown && tagSearch && availableTags.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4 text-center">
                                <p className="text-sm text-gray-400">Press Enter to add custom tag</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
