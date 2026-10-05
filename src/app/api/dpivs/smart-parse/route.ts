// src/app/api/dpivs/smart-parse/route.ts
import { NextResponse } from "next/server";
import { executeAITask, extractStructuredJSON } from "@/lib/ai";
import {
  cleanEntityText,
  isDummyValue,
  mergeSmartParsedConfidenceData,
  parseBloodGroup,
  parseDistrict,
  parseGender,
  parseState,
  parseTextLocallyWithConfidence,
  SmartParsedConfidenceData,
  validateAadhaarNumber,
  validateMobileNumber,
} from "@/lib/smart-parser";

export const dynamic = "force-dynamic";

/**
 * Validates & Normalizes AI raw JSON output into strict SmartParsedConfidenceData
 */
function normalizeAndVerifyAIOutput(json: any): SmartParsedConfidenceData {
  if (!json || typeof json !== "object") return {};

  const result: SmartParsedConfidenceData = {};

  const getValAndConf = (raw: any): { val?: string; conf: number } => {
    if (!raw) return { val: undefined, conf: 0 };
    if (typeof raw === "object" && raw !== null && "value" in raw) {
      const v = String(raw.value || "").trim();
      const c = typeof raw.confidence === "number" ? raw.confidence : 90;
      return { val: v, conf: c };
    }
    const v = String(raw).trim();
    return { val: v, conf: 88 };
  };

  // 1. Full Name (Never guess, clean filler words, cannot be city/district)
  const nameObj = getValAndConf(json.fullName || json.name);
  if (nameObj.val && !isDummyValue(nameObj.val)) {
    const cleanedName = cleanEntityText(nameObj.val);
    if (cleanedName && cleanedName.length >= 3) {
      result.fullName = { value: cleanedName, confidence: nameObj.conf };
    }
  }

  // 2. Father Name
  const fatherObj = getValAndConf(json.fatherName || json.father);
  if (fatherObj.val && !isDummyValue(fatherObj.val)) {
    const cleanedFather = cleanEntityText(fatherObj.val);
    if (cleanedFather && cleanedFather.length >= 3) {
      result.fatherName = { value: cleanedFather, confidence: fatherObj.conf };
    }
  }

  // 3. Aadhaar Number (12 digits strictly)
  const aadhaarObj = getValAndConf(json.aadhaar || json.aadhaarNumber);
  if (aadhaarObj.val) {
    const validRes = validateAadhaarNumber(aadhaarObj.val);
    if (validRes.valid && validRes.clean) {
      result.aadhaarNumber = { value: validRes.clean, confidence: Math.max(95, aadhaarObj.conf) };
    }
  }

  // 4. Mobile Number (10 digits strictly starting 6-9)
  const mobileObj = getValAndConf(json.mobile || json.phone);
  if (mobileObj.val) {
    const validRes = validateMobileNumber(mobileObj.val);
    if (validRes.valid && validRes.clean) {
      result.mobile = { value: validRes.clean, confidence: Math.max(95, mobileObj.conf) };
    }
  }

  // 5. Email
  const emailObj = getValAndConf(json.email);
  if (emailObj.val && !isDummyValue(emailObj.val)) {
    const emailMatch = emailObj.val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      result.email = { value: emailMatch[0].toLowerCase(), confidence: emailObj.conf };
    }
  }

  // 6. Gender
  const genderObj = getValAndConf(json.gender);
  if (genderObj.val) {
    const g = parseGender(genderObj.val);
    if (g) {
      result.gender = { value: g, confidence: genderObj.conf };
    }
  }

  // 7. Blood Group
  const bgObj = getValAndConf(json.bloodGroup);
  if (bgObj.val) {
    const bg = parseBloodGroup(bgObj.val);
    if (bg) {
      result.bloodGroup = { value: bg, confidence: bgObj.conf };
    }
  }

  // 8. District
  const districtObj = getValAndConf(json.district);
  if (districtObj.val) {
    const d = parseDistrict(districtObj.val);
    if (d) {
      result.district = { value: d, confidence: districtObj.conf };
    }
  }

  // 9. State
  const stateObj = getValAndConf(json.state);
  if (stateObj.val) {
    const s = parseState(stateObj.val);
    if (s) {
      result.state = { value: s, confidence: stateObj.conf };
    }
  }

  // 10. City / Village
  const cityObj = getValAndConf(json.village || json.city || json.villageCity);
  if (cityObj.val && !isDummyValue(cityObj.val)) {
    const cleanCity = cleanEntityText(cityObj.val);
    if (cleanCity && cleanCity.length >= 3) {
      result.villageCity = { value: cleanCity, confidence: cityObj.conf };
    }
  }

  // 11. PIN Code (6 digits)
  const pinObj = getValAndConf(json.pinCode || json.pin);
  if (pinObj.val && !isDummyValue(pinObj.val)) {
    const pinMatch = pinObj.val.match(/\b[1-9]\d{5}\b/);
    if (pinMatch) {
      result.pinCode = { value: pinMatch[0], confidence: pinObj.conf };
    }
  }

  // 12. Designation
  const desigObj = getValAndConf(json.designation);
  if (desigObj.val && !isDummyValue(desigObj.val)) {
    result.designation = { value: cleanEntityText(desigObj.val), confidence: desigObj.conf };
  }

  // 13. Department
  const deptObj = getValAndConf(json.department);
  if (deptObj.val && !isDummyValue(deptObj.val)) {
    result.department = { value: cleanEntityText(deptObj.val), confidence: deptObj.conf };
  }

  // 14. Beat
  const beatObj = getValAndConf(json.beat);
  if (beatObj.val && !isDummyValue(beatObj.val)) {
    result.beat = { value: cleanEntityText(beatObj.val), confidence: beatObj.conf };
  }

  // 15. Experience
  const expObj = getValAndConf(json.experience);
  if (expObj.val) {
    const num = parseInt(expObj.val, 10);
    if (!isNaN(num) && num >= 0 && num <= 50) {
      result.experience = { value: num, confidence: expObj.conf };
    }
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, images } = body;

    // Strict JSON System Prompt with Confidence Scoring & Entity Recognition Rules
    const systemPrompt = `You are a zero-hallucination, high-accuracy entity recognition AI for DPIVS document and press profile extraction.
Your task is to analyze natural language text OR document images (Aadhaar, Press ID, Visiting Card, Resume) and extract ONLY explicitly mentioned facts.

CRITICAL RULES:
1. NEVER GUESS, ESTIMATE, OR HALLUCINATE. If a field is not explicitly mentioned, omit it completely.
2. Filter out filler words ("hai", "ka", "ke", "rehne wala", "mera naam"). "Raj Verma hai" MUST become "Raj Verma".
3. Ignore dummy values: "123456789012", "9876543210", "test@gmail.com".
4. A person's name MUST NEVER be mapped to City or District.
5. Provide a confidence score (0 to 100) for every extracted field.

EXPECTED STRICT JSON FORMAT:
{
  "fullName": { "value": "Raj Verma", "confidence": 98 },
  "fatherName": { "value": "Suresh Verma", "confidence": 95 },
  "aadhaar": { "value": "123456789012", "confidence": 99 },
  "mobile": { "value": "8601343232", "confidence": 99 },
  "email": { "value": "raj@gmail.com", "confidence": 95 },
  "gender": { "value": "male", "confidence": 90 },
  "bloodGroup": { "value": "O+", "confidence": 95 },
  "address": { "value": "Dullahpur", "confidence": 88 },
  "village": { "value": "Dullahpur", "confidence": 85 },
  "city": { "value": "Dullahpur", "confidence": 85 },
  "district": { "value": "Ghazipur", "confidence": 96 },
  "state": { "value": "Uttar Pradesh", "confidence": 98 },
  "pinCode": { "value": "233300", "confidence": 90 },
  "designation": { "value": "Field Reporter", "confidence": 92 },
  "department": { "value": "Editorial", "confidence": 85 },
  "beat": { "value": "Crime", "confidence": 85 },
  "experience": { "value": "5", "confidence": 90 }
}

Return ONLY valid JSON.`;

    // ─────────────────────────────────────────────────────────────
    // FEATURE 2: SMART IMAGE INPUT (Preprocessed OCR + Vision AI)
    // ─────────────────────────────────────────────────────────────
    if (images && Array.isArray(images) && images.length > 0) {
      const parsedResults: SmartParsedConfidenceData[] = [];

      try {
        const aiRes = await executeAITask({
          task: "dpivs-vision",
          prompt: `Read document text and extract exact credential JSON with confidence scores.\n${systemPrompt}`,
          images,
          jsonOutput: true,
          temperature: 0.1,
          timeoutMs: 15000,
        });

        const json = aiRes.json || extractStructuredJSON(aiRes.text);
        if (json) {
          parsedResults.push(normalizeAndVerifyAIOutput(json));
        }

        if (parsedResults.length > 0) {
          const mergedData = mergeSmartParsedConfidenceData(parsedResults);
          return NextResponse.json({
            success: true,
            data: mergedData,
            provider: `${aiRes.provider} (${aiRes.model})`,
            fallbackUsed: aiRes.fallbackUsed,
          });
        }
      } catch (visErr: any) {
        console.warn("[Smart Parse] Vision extraction error:", visErr.message);
      }

      return NextResponse.json({ success: true, data: {}, provider: "none" });
    }

    // ─────────────────────────────────────────────────────────────
    // FEATURE 1: SMART TEXT INPUT (Zero-Hallucination NLP)
    // ─────────────────────────────────────────────────────────────
    if (text && typeof text === "string" && text.trim()) {
      let aiParsedData: SmartParsedConfidenceData | null = null;
      let usedProvider = "local_nlp";

      try {
        const aiRes = await executeAITask({
          task: "dpivs-text-parse",
          prompt: `Extract entity JSON with confidence scores from this text:\n"${text}"`,
          systemPrompt,
          jsonOutput: true,
          temperature: 0.1,
          timeoutMs: 8000,
        });

        const json = aiRes.json || extractStructuredJSON(aiRes.text);
        if (json) {
          aiParsedData = normalizeAndVerifyAIOutput(json);
          usedProvider = `${aiRes.provider} (${aiRes.model})`;
        }
      } catch (aiErr: any) {
        console.warn("[Smart Parse] AI parsing fallback to local rules:", aiErr.message);
      }

      // Merge with Local Rule-Based NLP for maximal accuracy & 0 hallucinations
      const localData = parseTextLocallyWithConfidence(text);
      const combined = mergeSmartParsedConfidenceData([localData, aiParsedData || {}]);

      return NextResponse.json({
        success: true,
        data: combined,
        provider: usedProvider,
      });
    }

    return NextResponse.json({ error: "No text or image provided for smart parsing." }, { status: 400 });
  } catch (error: any) {
    console.error("Smart Parse API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute smart parse." }, { status: 500 });
  }
}
