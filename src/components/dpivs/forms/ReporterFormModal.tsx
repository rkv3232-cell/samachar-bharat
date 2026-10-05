// src/components/dpivs/forms/ReporterFormModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  Brain,
  Camera,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Percent,
} from "lucide-react";
import {
  ReporterProfile,
  CreateReporterInput,
  BloodGroup,
  Gender,
} from "@/types/dpivs";
import { validateReporterInput } from "@/lib/dpivs";
import {
  checkDuplicateReporter,
  parseTextLocallyWithConfidence,
  preprocessImageForOCR,
  SmartParsedConfidenceData,
} from "@/lib/smart-parser";
import MediaUploader from "./MediaUploader";
import { toast } from "sonner";

interface ReporterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReporterInput) => Promise<void>;
  initialData?: ReporterProfile | null;
  mode: "create" | "edit";
  reporters?: ReporterProfile[];
}

export default function ReporterFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  reporters = [],
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

  // Track confidence per field for UI highlights
  const [fieldConfidences, setFieldConfidences] = useState<Record<string, { confidence: number; lowConfidence: boolean }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "smart" | "personal" | "professional" | "contact" | "emergency" | "media" | "card"
  >(mode === "create" ? "smart" : "personal");

  // Smart Input States
  const [smartInputText, setSmartInputText] = useState("");
  const [smartImages, setSmartImages] = useState<string[]>([]);
  const [isParsingText, setIsParsingText] = useState(false);
  const [isParsingImages, setIsParsingImages] = useState(false);
  const [extractedSummary, setExtractedSummary] = useState<{ field: string; val: string; conf: number; low: boolean }[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setActiveTab("personal");
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
      setActiveTab("smart");
    }
    setErrors({});
    setFieldConfidences({});
    setExtractedSummary(null);
    setSmartInputText("");
    setSmartImages([]);
  }, [initialData, mode, isOpen]);

  // Real-time Duplicate Check
  useEffect(() => {
    if (isOpen && reporters.length > 0) {
      const dupResult = checkDuplicateReporter(formData, reporters, initialData?.id);
      if (dupResult.isDuplicate) {
        setDuplicateWarning(dupResult.message || "Duplicate reporter credential detected!");
      } else {
        setDuplicateWarning(null);
      }
    }
  }, [formData, reporters, initialData?.id, isOpen]);

  if (!isOpen) return null;

  // Apply parsed Smart Input data with 85% Confidence Threshold rule
  const applySmartParsedConfidenceData = (parsed: SmartParsedConfidenceData) => {
    const summaryItems: { field: string; val: string; conf: number; low: boolean }[] = [];
    const confMap: Record<string, { confidence: number; lowConfidence: boolean }> = {};

    setFormData((prev) => {
      const updated = { ...prev };

      const applyField = (key: string, cand: any, updater: (v: any) => void) => {
        if (!cand || cand.value === undefined || cand.value === null || cand.value === "") return;

        const conf = cand.confidence || 0;
        const low = conf < 85;

        confMap[key] = { confidence: conf, lowConfidence: low };
        summaryItems.push({ field: key, val: String(cand.value), conf, low });

        // Auto-fill ONLY if confidence >= 85%
        if (!low) {
          updater(cand.value);
        }
      };

      if (parsed.fullName) applyField("fullName", parsed.fullName, (v) => (updated.fullName = v));
      if (parsed.fatherName) applyField("fatherName", parsed.fatherName, (v) => (updated.fatherName = v));
      if (parsed.aadhaarNumber) applyField("aadhaarNumber", parsed.aadhaarNumber, (v) => (updated.aadhaarNumber = v));
      if (parsed.mobile) applyField("mobile", parsed.mobile, (v) => (updated.mobile = v));
      if (parsed.email) applyField("email", parsed.email, (v) => (updated.email = v));
      if (parsed.bloodGroup) applyField("bloodGroup", parsed.bloodGroup, (v) => (updated.bloodGroup = v));
      if (parsed.gender) applyField("gender", parsed.gender, (v) => (updated.gender = v));
      if (parsed.designation) applyField("designation", parsed.designation, (v) => (updated.designation = v));
      if (parsed.department) applyField("department", parsed.department, (v) => (updated.department = v));
      if (parsed.beat) applyField("beat", parsed.beat, (v) => (updated.beat = v));
      if (parsed.experience) applyField("experience", parsed.experience, (v) => (updated.experience = v));

      updated.address = { ...prev.address };
      if (parsed.street) applyField("street", parsed.street, (v) => (updated.address!.street = v));
      if (parsed.villageCity) applyField("villageCity", parsed.villageCity, (v) => (updated.address!.villageCity = v));
      if (parsed.district) applyField("district", parsed.district, (v) => (updated.address!.district = v));
      if (parsed.state) applyField("state", parsed.state, (v) => (updated.address!.state = v));
      if (parsed.pinCode) applyField("pinCode", parsed.pinCode, (v) => (updated.address!.pinCode = v));

      return updated;
    });

    setFieldConfidences(confMap);
    setExtractedSummary(summaryItems);
  };

  // ── Smart Text Parsing Handler ──
  const handleSmartTextParse = async () => {
    if (!smartInputText.trim()) {
      toast.error("Please enter text in the Smart Input field.");
      return;
    }

    setIsParsingText(true);
    try {
      const response = await fetch("/api/dpivs/smart-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: smartInputText }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        applySmartParsedConfidenceData(result.data);
        const providerName = result.provider ? ` (${result.provider})` : "";
        toast.success(`✨ Form auto-filled with OpenRouter AI!${providerName}`);
      } else {
        const localParsed = parseTextLocallyWithConfidence(smartInputText);
        applySmartParsedConfidenceData(localParsed);
        toast.success("Form auto-filled using rule-based NLP.");
      }
    } catch (err: any) {
      console.warn("AI Smart Text parse network error, using local fallback:", err);
      const localParsed = parseTextLocallyWithConfidence(smartInputText);
      applySmartParsedConfidenceData(localParsed);
      toast.success("Form auto-filled using local pattern parsing.");
    } finally {
      setIsParsingText(false);
    }
  };

  // ── Smart Image Upload Handlers with Preprocessing ──
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawBase64 = event.target?.result as string;
        if (rawBase64) {
          // Preprocess image (upscale, sharpen, contrast boost)
          const preprocessed = await preprocessImageForOCR(rawBase64);
          setSmartImages((prev) => [...prev, preprocessed]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (e.target) e.target.value = "";
  };

  const removeSmartImage = (index: number) => {
    setSmartImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSmartImageParse = async () => {
    if (smartImages.length === 0) {
      toast.error("Please upload at least 1 document image (Aadhaar, Press ID, Visiting Card, etc.).");
      return;
    }

    setIsParsingImages(true);
    try {
      const response = await fetch("/api/dpivs/smart-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: smartImages }),
      });

      const result = await response.json();
      if (result.success && result.data && Object.keys(result.data).length > 0) {
        applySmartParsedConfidenceData(result.data);
        const providerName = result.provider ? ` (${result.provider})` : "";
        toast.success(`📷 Preprocessed OCR & OpenRouter Vision AI Auto-Filled!${providerName}`);
      } else {
        toast.error("Could not detect clear reporter details from uploaded image(s).");
      }
    } catch (err: any) {
      toast.error("Image OCR parsing error: " + err.message);
    } finally {
      setIsParsingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validation = validateReporterInput(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      if (
        validation.errors.fullName ||
        validation.errors.fatherName ||
        validation.errors.bloodGroup ||
        validation.errors.aadhaarNumber
      ) {
        setActiveTab("personal");
      } else if (validation.errors.designation) {
        setActiveTab("professional");
      } else if (validation.errors.mobile || validation.errors.pinCode || validation.errors.email) {
        setActiveTab("contact");
      }
      return;
    }

    if (duplicateWarning) {
      if (!confirm("A potential duplicate reporter was detected. Are you sure you want to proceed saving?")) {
        return;
      }
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

  // Helper component to render confidence badges next to inputs
  const renderConfidenceBadge = (fieldKey: string) => {
    const confObj = fieldConfidences[fieldKey];
    if (!confObj) return null;

    if (confObj.lowConfidence) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Low Conf ({confObj.confidence}%) - Review Needed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        {confObj.confidence}% Confident
      </span>
    );
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
              Digital Press Identity System — Zero-Hallucination OpenRouter AI & Preprocessed OCR
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
          {mode === "create" && (
            <button
              type="button"
              onClick={() => setActiveTab("smart")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "smart"
                  ? "border-amber-500 text-amber-600 bg-white rounded-t-lg shadow-xs"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Brain className="w-4 h-4 text-amber-500" /> 🧠 Smart Input (OpenRouter AI / OCR)
            </button>
          )}

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
          {/* General Form Error Banner */}
          {errors.form && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.form}
            </div>
          )}

          {/* Duplicate Reporter Alert Banner */}
          {duplicateWarning && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 mb-0.5">⚠️ Duplicate Reporter Warning</p>
                <p>{duplicateWarning}</p>
              </div>
            </div>
          )}

          {/* Extracted Fields Confidence Summary Banner */}
          {extractedSummary && extractedSummary.length > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-emerald-900">
                    ✅ AI Entity Extraction Results ({extractedSummary.length} fields):
                  </p>
                  <span className="text-[11px] font-semibold text-gray-500">
                    Strict Confidence Threshold: ≥85% Auto-Filled
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {extractedSummary.map((item, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg font-medium text-[11px] border flex items-center gap-1 ${
                        item.low
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border-emerald-300"
                      }`}
                    >
                      {item.low ? <AlertTriangle className="w-3 h-3 text-amber-600" /> : <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                      {item.field}: {item.val} ({item.conf}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 0: SMART AI INPUT */}
          {activeTab === "smart" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Feature 1: Smart Text Input */}
              <div className="p-5 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 border border-amber-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-bold text-gray-900">🧠 Smart Text Input (OpenRouter AI)</h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                    Zero-Hallucination & Confidence Scoring
                  </span>
                </div>

                <p className="text-xs text-gray-600">
                  Normal bhasha me reporter detail likhein. AI entities extract karega aur &ge;85% confidence wale fields auto-fill karega.
                </p>

                <div>
                  <textarea
                    rows={4}
                    value={smartInputText}
                    onChange={(e) => setSmartInputText(e.target.value)}
                    placeholder='Jaise: "Raj Verma, mobile 8601343232, email raj@gmail.com, blood group O+, address Dullahpur, Ghazipur, Uttar Pradesh, Aadhaar 123456789012, designation Field Reporter."'
                    className="w-full p-3.5 bg-white border border-amber-300 rounded-xl text-sm font-normal focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors shadow-inner"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-gray-500">Sample Prompts:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSmartInputText(
                        "Raj Verma, mobile 8601343232, email raj@gmail.com, blood group O+, address Dullahpur, Ghazipur, Uttar Pradesh, Aadhaar 123456789012, designation Field Reporter."
                      )
                    }
                    className="text-[11px] px-2.5 py-1 bg-amber-100/70 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors"
                  >
                    📝 English Format
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSmartInputText(
                        "Mera naam Raj Verma hai. Main Ghazipur ke Dullahpur ka rehne wala hun. Mera mobile 8601343232 hai. Blood Group O+ hai."
                      )
                    }
                    className="text-[11px] px-2.5 py-1 bg-amber-100/70 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors"
                  >
                    🇮🇳 Hindi Format
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSmartTextParse}
                    disabled={isParsingText || !smartInputText.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
                  >
                    {isParsingText ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" /> OpenRouter AI Parsing Entities...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> ⚡ Auto-Fill Form with OpenRouter AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Feature 2: Smart Image Upload */}
              <div className="p-5 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 border border-blue-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">📷 Smart Image Upload (Preprocessed OCR & Vision)</h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    Auto Contrast & Upscaling
                  </span>
                </div>

                <p className="text-xs text-gray-600">
                  Aadhaar Card, Press ID, Visiting Card ki image upload karein. System pehle image ko preprocess (upscale/sharpen) karke OpenRouter Vision AI dwara OCR text read karega.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 rounded-xl p-6 text-center cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">
                    Click to Upload Document Images (Aadhaar, Press ID, Resume)
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Canvas Auto-Preprocessing Enabled for Max OCR Accuracy</p>
                </div>

                {smartImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700">Preprocessed Images ({smartImages.length}):</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {smartImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-300 h-24 bg-gray-100">
                          <img src={img} alt={`Document ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeSmartImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSmartImageParse}
                    disabled={isParsingImages || smartImages.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                  >
                    {isParsingImages ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" /> Vision OCR Extracting Entities...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" /> ✨ Preprocess & Auto-Fill Form
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Full Name (English / Devanagari) <span className="text-red-500">*</span>
                    </label>
                    {renderConfidenceBadge("fullName")}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raj Verma / राज वर्मा"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.fullName
                        ? "border-red-500 bg-red-50/20"
                        : fieldConfidences["fullName"]?.lowConfidence
                        ? "border-amber-400 bg-amber-50/30"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Father's Name <span className="text-red-500">*</span>
                    </label>
                    {renderConfidenceBadge("fatherName")}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Verma"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.fatherName
                        ? "border-red-500 bg-red-50/20"
                        : fieldConfidences["fatherName"]?.lowConfidence
                        ? "border-amber-400 bg-amber-50/30"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.fatherName && <p className="text-xs text-red-600 mt-1">{errors.fatherName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Aadhaar Number (12 Digits)
                    </label>
                    {renderConfidenceBadge("aadhaarNumber")}
                  </div>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="123456789012"
                    value={formData.aadhaarNumber || ""}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.aadhaarNumber ? "border-red-500 bg-red-50/20" : "border-gray-300"
                    }`}
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Gender
                    </label>
                    {renderConfidenceBadge("gender")}
                  </div>
                  <select
                    value={formData.gender || "male"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    {renderConfidenceBadge("bloodGroup")}
                  </div>
                  <select
                    required
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.bloodGroup ? "border-red-500 bg-red-50/20" : "border-gray-300"
                    }`}
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    {renderConfidenceBadge("designation")}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Field Reporter / Bureau Chief"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.designation ? "border-red-500 bg-red-50/20" : "border-gray-300"
                    }`}
                  />
                  {errors.designation && <p className="text-xs text-red-600 mt-1">{errors.designation}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Department
                    </label>
                    {renderConfidenceBadge("department")}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Editorial & Reporting"
                    value={formData.department || ""}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Beat (Coverage Area)
                    </label>
                    {renderConfidenceBadge("beat")}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Crime / Admin / Local News"
                    value={formData.beat || ""}
                    onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Experience (Years)
                    </label>
                    {renderConfidenceBadge("experience")}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={formData.experience || 1}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Mobile Number (10 Digits) <span className="text-red-500">*</span>
                    </label>
                    {renderConfidenceBadge("mobile")}
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 8601343232"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.mobile ? "border-red-500 bg-red-50/20" : "border-gray-300"
                    }`}
                  />
                  {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Email Address
                    </label>
                    {renderConfidenceBadge("email")}
                  </div>
                  <input
                    type="email"
                    placeholder="e.g. raj@gmail.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.email ? "border-red-500 bg-red-50/20" : "border-gray-300"
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Street / Locality Address
                  </label>
                  {renderConfidenceBadge("street")}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Main Market, Dullahpur"
                  value={formData.address?.street || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Village / City
                    </label>
                    {renderConfidenceBadge("villageCity")}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Dullahpur"
                    value={formData.address?.villageCity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, villageCity: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      District
                    </label>
                    {renderConfidenceBadge("district")}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Ghazipur"
                    value={formData.address?.district || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, district: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      State
                    </label>
                    {renderConfidenceBadge("state")}
                  </div>
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      PIN Code (6 Digits)
                    </label>
                    {renderConfidenceBadge("pinCode")}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 233300"
                    value={formData.address?.pinCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, pinCode: e.target.value },
                      })
                    }
                    className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.pinCode ? "border-red-500 bg-red-50/20" : "border-gray-300"
                    }`}
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
                    placeholder="e.g. Suresh Verma"
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Father / Brother"
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MEDIA UPLOADS */}
          {activeTab === "media" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaUploader
                  label="Reporter Photo"
                  subfolder="photos"
                  currentUrl={formData.photoURL}
                  onUrlChange={(url) => setFormData({ ...formData, photoURL: url })}
                  aspectRatio="portrait"
                  helpText="Passport-size headshot with clear background."
                />

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

          {/* TAB 6: CARD SETTINGS */}
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
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
                  placeholder="Enter any administrative background verification notes..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== (mode === "create" ? "smart" : "personal") && (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<"smart" | "personal" | "professional" | "contact" | "emergency" | "media" | "card"> =
                    mode === "create"
                      ? ["smart", "personal", "professional", "contact", "emergency", "media", "card"]
                      : ["personal", "professional", "contact", "emergency", "media", "card"];
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
                  const tabs: Array<"smart" | "personal" | "professional" | "contact" | "emergency" | "media" | "card"> =
                    mode === "create"
                      ? ["smart", "personal", "professional", "contact", "emergency", "media", "card"]
                      : ["personal", "professional", "contact", "emergency", "media", "card"];
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
