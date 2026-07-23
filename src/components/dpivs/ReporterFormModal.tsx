// ============================================================
// components/dpivs/ReporterFormModal.tsx
// Add / Edit reporter form used by the DPIVS admin module.
// Reuses the shared admin Modal and the Cloudinary uploader.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/admin/ui/Modal";
import { uploadToCloudinary } from "@/lib/firebase";
import { useToast } from "@/contexts/ToastContext";
import type { Reporter, ReporterInput, ReporterStatus } from "@/types/dpivs";
import { UploadCloud, User } from "lucide-react";

interface ReporterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ReporterInput) => Promise<void>;
    reporter?: Reporter | null;
}

const DESIGNATIONS = [
    "Reporter",
    "Senior Reporter",
    "Bureau Chief",
    "Correspondent",
    "Sub Editor",
    "Editor",
    "Photographer",
    "Camera Person",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUSES: ReporterStatus[] = ["pending", "active", "suspended", "expired"];

function today(): string {
    return new Date().toISOString().split("T")[0];
}

function oneYearFromNow(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
}

const EMPTY: ReporterInput = {
    fullName: "",
    photoUrl: "",
    signatureUrl: "",
    aadhaar: "",
    mobile: "",
    email: "",
    designation: "Reporter",
    bureau: "",
    district: "",
    state: "",
    bloodGroup: "",
    joiningDate: today(),
    validFrom: today(),
    validTill: oneYearFromNow(),
    status: "active",
};

export default function ReporterFormModal({
    isOpen,
    onClose,
    onSave,
    reporter,
}: ReporterFormModalProps) {
    const { addToast } = useToast();
    const [form, setForm] = useState<ReporterInput>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingSign, setUploadingSign] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (reporter) {
                setForm({
                    fullName: reporter.fullName,
                    photoUrl: reporter.photoUrl || "",
                    signatureUrl: reporter.signatureUrl || "",
                    aadhaar: reporter.aadhaar || "",
                    mobile: reporter.mobile,
                    email: reporter.email,
                    designation: reporter.designation,
                    bureau: reporter.bureau || "",
                    district: reporter.district || "",
                    state: reporter.state || "",
                    bloodGroup: reporter.bloodGroup || "",
                    joiningDate: reporter.joiningDate || today(),
                    validFrom: reporter.validFrom,
                    validTill: reporter.validTill,
                    status: reporter.status,
                });
            } else {
                setForm(EMPTY);
            }
        }
    }, [isOpen, reporter]);

    const set = <K extends keyof ReporterInput>(key: K, value: ReporterInput[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleUpload = async (
        file: File,
        field: "photoUrl" | "signatureUrl"
    ) => {
        const setter = field === "photoUrl" ? setUploadingPhoto : setUploadingSign;
        try {
            setter(true);
            const url = await uploadToCloudinary(file);
            if (url) {
                set(field, url);
                addToast("Image uploaded", "success");
            }
        } catch {
            addToast("Upload failed", "error");
        } finally {
            setter(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName.trim()) return addToast("Full name is required", "error");
        if (!form.mobile.trim()) return addToast("Mobile number is required", "error");
        if (!form.email.trim()) return addToast("Email is required", "error");

        try {
            setSaving(true);
            await onSave(form);
            onClose();
        } catch {
            addToast("Failed to save reporter", "error");
        } finally {
            setSaving(false);
        }
    };

    const inputCls =
        "w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow";
    const labelCls =
        "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={reporter ? "Edit Reporter" : "Add Reporter"}
            maxWidth="max-w-3xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Photo + Signature */}
                <div className="flex flex-wrap gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-28 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                            {form.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={form.photoUrl || "/placeholder.svg"}
                                    alt="Reporter"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 text-gray-300" />
                            )}
                        </div>
                        <label className="cursor-pointer text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
                            <UploadCloud size={14} />
                            {uploadingPhoto ? "Uploading..." : "Photo"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                    e.target.files?.[0] &&
                                    handleUpload(e.target.files[0], "photoUrl")
                                }
                            />
                        </label>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-40 h-28 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                            {form.signatureUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={form.signatureUrl || "/placeholder.svg"}
                                    alt="Signature"
                                    className="w-full h-full object-contain p-1"
                                />
                            ) : (
                                <span className="text-xs text-gray-400">Signature</span>
                            )}
                        </div>
                        <label className="cursor-pointer text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
                            <UploadCloud size={14} />
                            {uploadingSign ? "Uploading..." : "Signature"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                    e.target.files?.[0] &&
                                    handleUpload(e.target.files[0], "signatureUrl")
                                }
                            />
                        </label>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Full Name *</label>
                        <input
                            className={inputCls}
                            value={form.fullName}
                            onChange={(e) => set("fullName", e.target.value)}
                            placeholder="e.g., Rahul Sharma"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Mobile *</label>
                        <input
                            className={inputCls}
                            value={form.mobile}
                            onChange={(e) => set("mobile", e.target.value)}
                            placeholder="10-digit mobile"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Email *</label>
                        <input
                            type="email"
                            className={inputCls}
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder="name@example.com"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>
                            Aadhaar{" "}
                            <span className="text-gray-400 normal-case font-normal">
                                (optional)
                            </span>
                        </label>
                        <input
                            className={inputCls}
                            value={form.aadhaar}
                            onChange={(e) => set("aadhaar", e.target.value)}
                            placeholder="XXXX XXXX XXXX"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Designation</label>
                        <select
                            className={inputCls}
                            value={form.designation}
                            onChange={(e) => set("designation", e.target.value)}
                        >
                            {DESIGNATIONS.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className={labelCls}>Bureau</label>
                        <input
                            className={inputCls}
                            value={form.bureau}
                            onChange={(e) => set("bureau", e.target.value)}
                            placeholder="e.g., City Bureau"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>District</label>
                        <input
                            className={inputCls}
                            value={form.district}
                            onChange={(e) => set("district", e.target.value)}
                            placeholder="e.g., Ghaziabad"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>State</label>
                        <input
                            className={inputCls}
                            value={form.state}
                            onChange={(e) => set("state", e.target.value)}
                            placeholder="e.g., Uttar Pradesh"
                        />
                    </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <label className={labelCls}>Blood Group</label>
                        <select
                            className={inputCls}
                            value={form.bloodGroup}
                            onChange={(e) => set("bloodGroup", e.target.value)}
                        >
                            <option value="">—</option>
                            {BLOOD_GROUPS.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Joining Date</label>
                        <input
                            type="date"
                            className={inputCls}
                            value={form.joiningDate}
                            onChange={(e) => set("joiningDate", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Valid From</label>
                        <input
                            type="date"
                            className={inputCls}
                            value={form.validFrom}
                            onChange={(e) => set("validFrom", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Valid Till</label>
                        <input
                            type="date"
                            className={inputCls}
                            value={form.validTill}
                            onChange={(e) => set("validTill", e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelCls}>Status</label>
                    <select
                        className={inputCls}
                        value={form.status}
                        onChange={(e) => set("status", e.target.value as ReporterStatus)}
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || uploadingPhoto || uploadingSign}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {saving ? "Saving..." : reporter ? "Save Changes" : "Add Reporter"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
