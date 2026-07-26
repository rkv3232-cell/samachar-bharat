// src/components/dpivs/forms/ReporterFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Briefcase,
  MapPin,
  ShieldAlert,
  UploadCloud,
  Settings,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  ReporterProfile,
  CreateReporterInput,
  ReporterStatus,
  BloodGroup,
  Gender,
} from "@/types/dpivs";
import { validateReporterInput, generatePressIdNumber } from "@/lib/dpivs";
import MediaUploader from "./MediaUploader";

interface ReporterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReporterInput) => Promise<void>;
  initialData?: ReporterProfile | null;
  mode: "create" | "edit";
}

export default function ReporterFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ReporterFormModalProps) {
  const [formData, setFormData] = useState<CreateReporterInput>({
    aadhaarNumber: "",
    fullName: "",
    fatherName: "",
    dateOfBirth: "",
    gender: "male",
    bloodGroup: "O+",

    employeeId: "",
    designation: "Staff Reporter",
    department: "Editorial & Reporting",
    beat: "",
    joiningDate: "",
    experience: 1,

    mobile: "",
    alternateMobile: "",
    email: "",
    address: {
      street: "",
      villageCity: "",
      district: "",
      state: "Uttar Pradesh",
      pinCode: "",
    },

    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },

    photoURL: "",
    signatureImageURL: "",
    stampImageURL: "",

    validityMonths: 12,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "professional" | "contact" | "emergency" | "media" | "card"
  >("personal");

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        aadhaarNumber: initialData.aadhaarNumber || "",
        fullName: initialData.fullName || "",
        fatherName: initialData.fatherName || "",
        dateOfBirth: initialData.dateOfBirth || "",
        gender: initialData.gender || "male",
        bloodGroup: initialData.bloodGroup || "O+",

        employeeId: initialData.employeeId || "",
        designation: initialData.designation || "Staff Reporter",
        department: initialData.department || "Editorial",
        beat: initialData.beat || "",
        joiningDate: initialData.joiningDate || "",
        experience: initialData.experience || 1,

        mobile: initialData.mobile || "",
        alternateMobile: initialData.alternateMobile || "",
        email: initialData.email || "",
        address: {
          street: initialData.address?.street || "",
          villageCity: initialData.address?.villageCity || "",
          district: initialData.address?.district || "",
          state: initialData.address?.state || "Uttar Pradesh",
          pinCode: initialData.address?.pinCode || "",
        },

        emergencyContact: {
          name: initialData.emergencyContact?.name || "",
          relationship: initialData.emergencyContact?.relationship || "",
          phone: initialData.emergencyContact?.phone || "",
        },

        photoURL: initialData.photoURL || "",
        signatureImageURL: initialData.signatureImageURL || "",
        stampImageURL: initialData.stampImageURL || "",

        validityMonths: 12,
        notes: initialData.notes || "",
      });
    } else if (mode === "create") {
      setFormData({
        aadhaarNumber: "",
        fullName: "",
        fatherName: "",
        dateOfBirth: "",
        gender: "male",
        bloodGroup: "O+",

        employeeId: "",
        designation: "Staff Reporter",
        department: "Editorial & Reporting",
        beat: "",
        joiningDate: "",
        experience: 1,

        mobile: "",
        alternateMobile: "",
        email: "",
        address: {
          street: "",
          villageCity: "",
          district: "",
          state: "Uttar Pradesh",
          pinCode: "",
        },

        emergencyContact: {
          name: "",
          relationship: "",
          phone: "",
        },

        photoURL: "",
        signatureImageURL: "",
        stampImageURL: "",

        validityMonths: 12,
        notes: "",
      });
    }
    setErrors({});
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validation = validateReporterInput(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      // Auto switch to tab containing the first error
      if (validation.errors.fullName || validation.errors.fatherName || validation.errors.bloodGroup || validation.errors.aadhaarNumber) {
        setActiveTab("personal");
      } else if (validation.errors.designation) {
        setActiveTab("professional");
      } else if (validation.errors.mobile || validation.errors.pinCode || validation.errors.email) {
        setActiveTab("contact");
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to save reporter profile." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex justify-between items-center border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {mode === "create" ? "Register New Reporter (Press Card)" : "Edit Reporter Profile"}
            </h2>
            <p className="text-xs text-gray-400">
              Digital Press Identity & Verification System — Complete Professional Profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto no-scrollbar px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "personal"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <User className="w-4 h-4" /> Personal Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("professional")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "professional"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Briefcase className="w-4 h-4" /> Professional
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "contact"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <MapPin className="w-4 h-4" /> Contact & Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("emergency")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "emergency"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Emergency
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "media"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <UploadCloud className="w-4 h-4" /> Photo & Uploads
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("card")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "card"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Settings className="w-4 h-4" /> Card Settings
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.form && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.form}
            </div>
          )}

          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Full Name (English / Devanagari) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar Sharma / रमेश कुमार शर्मा"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Father's Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Sharma"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.fatherName && <p className="text-xs text-red-600 mt-1">{errors.fatherName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Aadhaar Number (12 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="XXXX-XXXX-XXXX"
                    value={formData.aadhaarNumber || ""}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.aadhaarNumber && <p className="text-xs text-red-600 mt-1">{errors.aadhaarNumber}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender || "male"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Blood Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                  {errors.bloodGroup && <p className="text-xs text-red-600 mt-1">{errors.bloodGroup}</p>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFESSIONAL INFORMATION */}
          {activeTab === "professional" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Reporter Code (Auto Generated)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={initialData?.pressIdNumber || "(Generated upon creation e.g. SB-REP-2026-XXXXXX)"}
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-lg text-sm cursor-not-allowed font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Unique Reporter Code is automatically assigned.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SB-EMP-104"
                    value={formData.employeeId || ""}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Bureau Reporter / Staff Reporter"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.designation && <p className="text-xs text-red-600 mt-1">{errors.designation}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Editorial / Investigation / Ground News"
                    value={formData.department || ""}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Beat (Coverage Area)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Crime / Politics / District Admin"
                    value={formData.beat || ""}
                    onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate || ""}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={formData.experience || 1}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & ADDRESS INFORMATION */}
          {activeTab === "contact" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. reporter@samacharbharat.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Street / Locality Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. H.No 42, Civil Lines"
                  value={formData.address?.street || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Village / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ghazipur"
                    value={formData.address?.villageCity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, villageCity: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ghazipur / Mau"
                    value={formData.address?.district || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, district: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Uttar Pradesh"
                    value={formData.address?.state || "Uttar Pradesh"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    PIN Code (6 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 233001"
                    value={formData.address?.pinCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, pinCode: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.pinCode && <p className="text-xs text-red-600 mt-1">{errors.pinCode}</p>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMERGENCY INFORMATION */}
          {activeTab === "emergency" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.emergencyContact?.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brother / Father / Spouse"
                    value={formData.emergencyContact?.relationship || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relationship: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Emergency Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={formData.emergencyContact?.phone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MEDIA & DOCUMENT UPLOADS (CLOUDINARY AUTOMATIC) */}
          {activeTab === "media" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <UploadCloud className="w-4 h-4" /> Automatic Cloudinary Upload System
                </p>
                <p>
                  Files selected below are uploaded directly to secure Cloudinary cloud storage.
                  The generated Cloudinary URLs are stored automatically. Raw URL input is not required.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Reporter Photo */}
                <MediaUploader
                  label="Reporter Photo"
                  subfolder="photos"
                  currentUrl={formData.photoURL}
                  onUrlChange={(url) => setFormData({ ...formData, photoURL: url })}
                  aspectRatio="portrait"
                  helpText="Passport-size headshot with clear background."
                />

                {/* 2. Reporter Signature */}
                <MediaUploader
                  label="Reporter Signature"
                  subfolder="signatures"
                  currentUrl={formData.signatureImageURL}
                  onUrlChange={(url) => setFormData({ ...formData, signatureImageURL: url })}
                  aspectRatio="landscape"
                  helpText="Clean signature on plain white background."
                />
              </div>
            </div>
          )}

          {/* TAB 6: CARD SETTINGS & NOTES */}
          {activeTab === "card" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Card Validity Period
                  </label>
                  <select
                    value={formData.validityMonths || 12}
                    onChange={(e) => setFormData({ ...formData, validityMonths: parseInt(e.target.value) || 12 })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value={6}>6 Months</option>
                    <option value={12}>1 Year (12 Months - Standard)</option>
                    <option value={24}>2 Years (24 Months)</option>
                    <option value={36}>3 Years (36 Months)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Internal Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter any administrative background verification notes or internal comments..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== "personal" && (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<"personal" | "professional" | "contact" | "emergency" | "media" | "card"> = [
                    "personal",
                    "professional",
                    "contact",
                    "emergency",
                    "media",
                    "card",
                  ];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Previous Step
              </button>
            )}
            {activeTab !== "card" && (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<"personal" | "professional" | "contact" | "emergency" | "media" | "card"> = [
                    "personal",
                    "professional",
                    "contact",
                    "emergency",
                    "media",
                    "card",
                  ];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
                }}
                className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Next Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>Saving Reporter Profile...</>
              ) : mode === "create" ? (
                <>Register Reporter & Generate Card</>
              ) : (
                <>Save Profile Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
