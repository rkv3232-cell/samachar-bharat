// ============================================================
// app/admin/categories/page.tsx
// COMPLETE CATEGORIES & TAGS MANAGEMENT SYSTEM
// Features: Add/Delete Categories with auto-slug,
//           Add/Delete Tags, Integration guide
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import {
    fetchCategories,
    addCategory,
    deleteCategory,
} from "@/lib/firestore/categories";
import { fetchTags, addTag, deleteTag } from "@/lib/firestore/tags";
import { useToast } from "@/contexts/ToastContext";
import type { Category, Tag } from "@/types";
import LoadingSpinner from "@/components/admin/ui/LoadingSpinner";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

export default function CategoriesPage() {
    // ─── Categories State ───────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [catLoading, setCatLoading] = useState(true);
    const [newCatName, setNewCatName] = useState("");
    const [newCatSlug, setNewCatSlug] = useState("");
    const [addingCat, setAddingCat] = useState(false);
    const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);

    // ─── Tags State ─────────────────────────────────
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagLoading, setTagLoading] = useState(true);
    const [newTagName, setNewTagName] = useState("");
    const [addingTag, setAddingTag] = useState(false);
    const [deleteTagTarget, setDeleteTagTarget] = useState<Tag | null>(null);

    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    // ─── Load Data ──────────────────────────────────
    const loadCategories = useCallback(async () => {
        try {
            setCatLoading(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch (error) {
            addToast("Failed to load categories", "error");
        } finally {
            setCatLoading(false);
        }
    }, [addToast]);

    const loadTags = useCallback(async () => {
        try {
            setTagLoading(true);
            const data = await fetchTags();
            setTags(data);
        } catch (error) {
            addToast("Failed to load tags", "error");
        } finally {
            setTagLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadCategories();
        loadTags();
    }, [loadCategories, loadTags]);

    // ─── Slug Generator ────────────────────────────
    const generateSlug = (name: string) =>
        name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s_]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/(^-|-$)/g, "");

    const handleCatNameChange = (value: string) => {
        setNewCatName(value);
        setNewCatSlug(generateSlug(value));
    };

    // ─── Add Category ──────────────────────────────
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = newCatName.trim();
        if (!name) {
            addToast("Category name is required", "error");
            return;
        }

        // Check duplicate
        if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
            addToast("This category already exists", "error");
            return;
        }

        const slug = newCatSlug || generateSlug(name);

        try {
            setAddingCat(true);
            const id = await addCategory(name, slug);
            setCategories((prev) =>
                [...prev, { id, name, slug }].sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
            );
            setNewCatName("");
            setNewCatSlug("");
            addToast("Category added successfully", "success");
        } catch (error) {
            addToast("Failed to add category", "error");
        } finally {
            setAddingCat(false);
        }
    };

    // ─── Delete Category ───────────────────────────
    const handleDeleteCategory = async () => {
        if (!deleteCatTarget) return;
        try {
            setActionLoading(true);
            await deleteCategory(deleteCatTarget.id);
            setCategories((prev) =>
                prev.filter((c) => c.id !== deleteCatTarget.id)
            );
            addToast("Category deleted", "success");
        } catch (error) {
            addToast("Failed to delete category", "error");
        } finally {
            setActionLoading(false);
            setDeleteCatTarget(null);
        }
    };

    // ─── Add Tag ────────────────────────────────────
    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = newTagName.trim();
        if (!name) {
            addToast("Tag name is required", "error");
            return;
        }

        // Check duplicate
        if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
            addToast("This tag already exists", "error");
            return;
        }

        try {
            setAddingTag(true);
            const id = await addTag(name);
            setTags((prev) =>
                [...prev, { id, name }].sort((a, b) => a.name.localeCompare(b.name))
            );
            setNewTagName("");
            addToast("Tag added successfully", "success");
        } catch (error) {
            addToast("Failed to add tag", "error");
        } finally {
            setAddingTag(false);
        }
    };

    // ─── Delete Tag ─────────────────────────────────
    const handleDeleteTag = async () => {
        if (!deleteTagTarget) return;
        try {
            setActionLoading(true);
            await deleteTag(deleteTagTarget.id);
            setTags((prev) => prev.filter((t) => t.id !== deleteTagTarget.id));
            addToast("Tag deleted", "success");
        } catch (error) {
            addToast("Failed to delete tag", "error");
        } finally {
            setActionLoading(false);
            setDeleteTagTarget(null);
        }
    };

    // ─── Render ─────────────────────────────────────
    return (
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    🏷️ Categories & Tags
                </h1>
                <p className="text-gray-500 mt-1">
                    Organize your posts with categories and tags
                </p>
            </div>

            {/* ─── Stats ─────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="rounded-xl p-5 bg-indigo-50 border border-indigo-200 text-indigo-700">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium opacity-80">Categories</p>
                        <span className="text-xl">📂</span>
                    </div>
                    <p className="text-3xl font-bold mt-1">{categories.length}</p>
                </div>
                <div className="rounded-xl p-5 bg-teal-50 border border-teal-200 text-teal-700">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium opacity-80">Tags</p>
                        <span className="text-xl">🏷️</span>
                    </div>
                    <p className="text-3xl font-bold mt-1">{tags.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ═══════════════════════════════════════ */}
                {/* CATEGORIES SECTION                      */}
                {/* ═══════════════════════════════════════ */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <h2 className="text-lg font-bold text-gray-900">📂 Categories</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {categories.length}{" "}
                            {categories.length === 1 ? "category" : "categories"} total
                        </p>
                    </div>

                    {/* Add Form */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <form onSubmit={handleAddCategory} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => handleCatNameChange(e.target.value)}
                                    placeholder="e.g., Technology"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Slug{" "}
                                    <span className="text-gray-400 normal-case font-normal">
                                        (auto-generated)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={newCatSlug}
                                    onChange={(e) => setNewCatSlug(e.target.value)}
                                    placeholder="technology"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-500 font-mono transition-shadow"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={addingCat || !newCatName.trim()}
                                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
                            >
                                {addingCat ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Adding...
                                    </span>
                                ) : (
                                    "+ Add Category"
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Categories List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {catLoading ? (
                            <LoadingSpinner message="Loading categories..." />
                        ) : categories.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-3xl mb-2">📂</p>
                                <p className="text-sm font-medium">No categories yet</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Add your first category above
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/80 transition-colors group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {cat.name}
                                            </p>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                                                /{cat.slug}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setDeleteCatTarget(cat)}
                                            className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════ */}
                {/* TAGS SECTION                            */}
                {/* ═══════════════════════════════════════ */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50">
                        <h2 className="text-lg font-bold text-gray-900">🏷️ Tags</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {tags.length} {tags.length === 1 ? "tag" : "tags"} total
                        </p>
                    </div>

                    {/* Add Form */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <form onSubmit={handleAddTag} className="flex gap-3">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="e.g., React, JavaScript, CSS"
                                className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                                onKeyDown={(e) => {
                                    // Allow adding tags with Enter
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTag(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={addingTag || !newTagName.trim()}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-all whitespace-nowrap shadow-sm"
                            >
                                {addingTag ? "Adding..." : "+ Add"}
                            </button>
                        </form>
                    </div>

                    {/* Tags Cloud */}
                    <div className="px-6 py-5 max-h-[400px] overflow-y-auto">
                        {tagLoading ? (
                            <LoadingSpinner message="Loading tags..." />
                        ) : tags.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-3xl mb-2">🏷️</p>
                                <p className="text-sm font-medium">No tags yet</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Add your first tag above
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2.5">
                                {tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors group cursor-default"
                                    >
                                        <span className="text-gray-400 text-xs">#</span>
                                        {tag.name}
                                        <button
                                            onClick={() => setDeleteTagTarget(tag)}
                                            className="w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all text-xs font-bold leading-none"
                                            title={`Delete "${tag.name}"`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* ─── Delete Confirmations ──────────────── */}
            <ConfirmDialog
                isOpen={!!deleteCatTarget}
                onClose={() => setDeleteCatTarget(null)}
                onConfirm={handleDeleteCategory}
                title="Delete Category"
                message={`Delete "${deleteCatTarget?.name}"? Posts using this category will show no category.`}
                confirmText="Delete Category"
                loading={actionLoading}
            />

            <ConfirmDialog
                isOpen={!!deleteTagTarget}
                onClose={() => setDeleteTagTarget(null)}
                onConfirm={handleDeleteTag}
                title="Delete Tag"
                message={`Delete the tag "${deleteTagTarget?.name}"?`}
                confirmText="Delete Tag"
                loading={actionLoading}
            />
        </div>
    );
}
