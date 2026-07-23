// ============================================================
// components/dpivs/PressIdCard.tsx
// Printable front & back Digital Press ID card (CR80 ratio).
// Purely presentational — receives a pre-generated QR data URL.
// ============================================================

import { Phone, Mail, Droplet } from "lucide-react";
import type { Reporter } from "@/types/dpivs";

const ORG_NAME = "SAMACHAR BHARAT";
const ORG_TAGLINE = "समाचार भारत — हिंदी समाचार";
const ORG_LOGO = "/dpivs/samachar-bharat-emblem.png";

function formatDate(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

interface PressIdCardProps {
    reporter: Reporter;
    qrDataUrl: string;
    verifyUrl: string;
}

export default function PressIdCard({ reporter, qrDataUrl, verifyUrl }: PressIdCardProps) {
    return (
        <div className="dpivs-card-sheet flex flex-wrap gap-6 justify-center">
            {/* ─── FRONT ─────────────────────────────── */}
            <div className="dpivs-card w-[340px] h-[214px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white flex flex-col">
                {/* Header */}
                <div className="bg-red-600 text-white px-4 py-2.5 flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={ORG_LOGO || "/placeholder.svg"}
                        alt={ORG_NAME}
                        className="w-9 h-9 object-contain bg-white/10 rounded-full p-0.5"
                        crossOrigin="anonymous"
                    />
                    <div className="leading-tight">
                        <p className="text-sm font-extrabold tracking-wide">{ORG_NAME}</p>
                        <p className="text-[9px] text-red-100">{ORG_TAGLINE}</p>
                    </div>
                    <span className="ml-auto text-[9px] font-bold bg-white text-red-600 px-2 py-0.5 rounded">
                        PRESS
                    </span>
                </div>

                {/* Body */}
                <div className="flex-1 flex gap-3 px-4 py-3">
                    {/* Photo */}
                    <div className="w-[76px] shrink-0">
                        <div className="w-[76px] h-[92px] rounded-lg overflow-hidden border-2 border-red-100 bg-gray-100 flex items-center justify-center">
                            {reporter.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={reporter.photoUrl || "/placeholder.svg"}
                                    alt={reporter.fullName}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <span className="text-[9px] text-gray-400">No Photo</span>
                            )}
                        </div>
                        <p className="mt-1 text-center font-mono text-[9px] font-bold text-red-600">
                            {reporter.reporterId}
                        </p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-extrabold text-gray-900 leading-tight truncate">
                            {reporter.fullName}
                        </p>
                        <p className="text-[10px] font-semibold text-red-600 mb-1.5">
                            {reporter.designation}
                        </p>

                        <dl className="space-y-0.5 text-[9px] text-gray-600">
                            {(reporter.bureau || reporter.district) && (
                                <div className="flex gap-1">
                                    <dt className="font-semibold text-gray-400">Bureau:</dt>
                                    <dd className="truncate">
                                        {[reporter.bureau, reporter.district].filter(Boolean).join(", ")}
                                    </dd>
                                </div>
                            )}
                            {reporter.state && (
                                <div className="flex gap-1">
                                    <dt className="font-semibold text-gray-400">State:</dt>
                                    <dd className="truncate">{reporter.state}</dd>
                                </div>
                            )}
                            <div className="flex gap-1">
                                <dt className="font-semibold text-gray-400">Valid:</dt>
                                <dd>
                                    {formatDate(reporter.validFrom)} – {formatDate(reporter.validTill)}
                                </dd>
                            </div>
                            {reporter.bloodGroup && (
                                <div className="flex items-center gap-1">
                                    <dt className="font-semibold text-gray-400">Blood:</dt>
                                    <dd className="inline-flex items-center gap-0.5 font-bold text-red-600">
                                        <Droplet size={9} /> {reporter.bloodGroup}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* QR */}
                    <div className="shrink-0 flex flex-col items-center justify-end">
                        {qrDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={qrDataUrl || "/placeholder.svg"}
                                alt="Verification QR"
                                className="w-[58px] h-[58px]"
                            />
                        ) : (
                            <div className="w-[58px] h-[58px] bg-gray-100 rounded" />
                        )}
                        <p className="text-[7px] text-gray-400 mt-0.5">Scan to verify</p>
                    </div>
                </div>
            </div>

            {/* ─── BACK ──────────────────────────────── */}
            <div className="dpivs-card w-[340px] h-[214px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white flex flex-col">
                <div className="bg-gray-900 text-white px-4 py-2 text-center">
                    <p className="text-[10px] font-bold tracking-wide">
                        OFFICIAL PRESS IDENTITY CARD
                    </p>
                </div>

                <div className="flex-1 px-4 py-3 flex gap-3">
                    <div className="flex-1 min-w-0">
                        <ul className="text-[8.5px] text-gray-600 space-y-1 leading-snug">
                            <li>• This card is the property of {ORG_NAME}.</li>
                            <li>• If found, please return to the issuing office.</li>
                            <li>• Valid only with holder&apos;s signature &amp; photo.</li>
                            <li>• Misuse is punishable under applicable law.</li>
                        </ul>

                        <div className="mt-2 space-y-1 text-[9px] text-gray-700">
                            <p className="flex items-center gap-1.5">
                                <Phone size={10} className="text-red-600" /> {reporter.mobile}
                            </p>
                            <p className="flex items-center gap-1.5 truncate">
                                <Mail size={10} className="text-red-600" /> {reporter.email}
                            </p>
                        </div>
                    </div>

                    <div className="w-[92px] shrink-0 flex flex-col items-center justify-between">
                        <div className="text-center">
                            <div className="h-[34px] flex items-end justify-center">
                                {reporter.signatureUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={reporter.signatureUrl || "/placeholder.svg"}
                                        alt="Signature"
                                        className="max-h-[34px] object-contain"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="w-full border-b border-gray-300" />
                                )}
                            </div>
                            <p className="text-[8px] text-gray-400 border-t border-gray-200 pt-0.5">
                                Authorised Signatory
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-2 text-center">
                    <p className="text-[7px] text-gray-400 break-all">{verifyUrl}</p>
                </div>
            </div>
        </div>
    );
}
