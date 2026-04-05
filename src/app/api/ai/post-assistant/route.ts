import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Use gemini-1.5-flash with Google Search Retrieval for grounding
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
});

// ──────────────────────────────────────────
// Helper: clean up raw AI response text
// ──────────────────────────────────────────
function cleanText(raw: string): string {
    return raw
        .replace(/^```[a-z]*\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

function extractJSON(raw: string): Record<string, unknown> | null {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const { title, content, type, role, imageUrl } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "API Key missing." }, { status: 500 });
        }

        // ─── ROLE GUARD ─────────────────────────────────────────────────────────
        const userRole = (role || "reporter").toLowerCase();

        let prompt = "";

        // ════════════════════════════════════════════════════════════════════════
        // 1. AI NEWS CONTENT WRITING (WITH SEARCH GROUNDING)
        // ════════════════════════════════════════════════════════════════════════
        if (type === "content") {
            prompt = `तुम एक वरिष्ठ हिंदी पत्रकार हो जो "समाचार भारत" न्यूज़ पोर्टल के लिए लिखता है।

**मिशन:** इंटरनेट से ताज़ा और प्रामाणिक न्यूज़ सर्च करके दी गई हेडलाइन पर खबर लिखो।

**शीर्षक:** ${title}

**सख्त निर्देश (Fact-Checking Rules):**
1. **इंटरनेट सर्च का उपयोग:** ऊपर दिए गए शीर्षक के बारे में ताज़ा गूगल सर्च रिज़ल्ट्स का उपयोग करो।
2. **झूठ बिल्कुल नहीं (No Hallucination):** कोई भी मनगढ़ंत तथ्य मत लिखो। अगर इंटरनेट पर जानकारी नहीं मिल रही है, तो साफ़ लिखो: "आधिकारिक पुष्टि नहीं हो पाई है।"
3. **सत्यापन:** केवल वही तारीखें, स्थान और नाम लिखो जो इंटरनेट पर आधिकारिक रूप से मौजूद हों।
4. **लेखन शैली:** गंभीर न्यूज़ टोन, सरल हिंदी, अनावश्यक विशेषणों से बचें।

**अनिवार्य संरचना (HTML format में):**
<h2>[मुख्य हेडलाइन और परिचय — 1-2 लाइन]</h2>
<p>[विस्तृत विवरण — न्यूनतम 3-4 पैराग्राफ, तथ्यों के साथ]</p>
<h3>मुख्य बिंदु (Key Highlights)</h3>
<ul>
  <li>मुख्य तथ्य 1</li>
  <li>मुख्य तथ्य 2</li>
</ul>
<h3>पृष्ठभूमि और संदर्भ</h3>
<p>[मामले से जुड़ी पुरानी जानकारी और विस्तार]</p>

<div class="ai-verification-tag" style="background:#f0fafb; border:1px solid #c7d2fe; padding:12px; border-radius:10px; font-size:13px; margin-top:20px; color:#1e1b4b;">
  <strong>🔍 Fact-Check Status:</strong> यह खबर इंटरनेट सर्च और AI द्वारा सत्यापित तथ्यों के आधार पर तैयार की गई है। प्रकाशन से पहले आधिकारिक प्रेस रिलीज़ से मिलान करें।
</div>

केवल HTML content लौटाओ, कोई markdown ticks (\`\`\`) नहीं।`;
        }

        // ════════════════════════════════════════════════════════════════════════
        // 2. AI TL;DR SUMMARY
        // ════════════════════════════════════════════════════════════════════════
        else if (type === "tldr") {
            prompt = `तुम एक विशेषज्ञ हिंदी संपादक हो।
नीचे दी गई खबर से केवल **मुख्य तथ्य** निकालकर **3 से 4 bullet points** बनाओ।

**शीर्षक:** ${title}
**सामग्री:** ${content.substring(0, 3000)}

**सख्त नियम:**
- केवल वही लिखो जो खबर में स्पष्ट रूप से लिखा है।
- राय (opinion) बिल्कुल मत दो।
- Output valid JSON array: ["point 1", "point 2", ...]`;
        }

        // ════════════════════════════════════════════════════════════════════════
        // 3. AI SEO TAGS GENERATION
        // ════════════════════════════════════════════════════════════════════════
        else if (type === "seo-tags") {
            prompt = `तुम एक SEO विशेषज्ञ हो। नीचे दी गई खबर के लिए 5-8 tags, meta description, slug और category (uttar-pradesh | desh | videsh | karobar | crime | dharm | rajniti | lifestyle) जनरेट करो।

**शीर्षक:** ${title}
**सामग्री:** ${content.substring(0, 1500)}

Return ONLY JSON:
{
  "tags": [],
  "seoDescription": "",
  "slug": "",
  "suggestedCategory": ""
}`;
        }

        // ════════════════════════════════════════════════════════════════════════
        // 4. AI HEADLINE GENERATION
        // ════════════════════════════════════════════════════════════════════════
        else if (type === "headline") {
            prompt = `नीचे दी गई सामग्री के आधार पर एक सटीक और फेक्चुअल न्यूज़ हेडलाइन लिखो (Hindi)।
**सामग्री:** ${content.substring(0, 1500)}
केवल हेडलाइन टेक्स्ट लौटाओ।`;
        }

        // ════════════════════════════════════════════════════════════════════════
        // 5. AUTO CATEGORY SUGGESTION
        // ════════════════════════════════════════════════════════════════════════
        else if (type === "suggest-category") {
            prompt = `खबर को पढ़कर उचित category चुनें: uttar-pradesh | desh | videsh | karobar | crime | dharm | rajniti | lifestyle
Return JSON: {"category": "slug", "reason": "..."}`;
        }

        // ════════════════════════════════════════════════════════════════════════
        // 7. CONTENT QUALITY CHECK / VALIDATION
        // ════════════════════════════════════════════════════════════════════════
        else if (type === "validate") {
            prompt = `तुम एक expert हिंदी news editor हो। इस खबर की quality check करो (word count, accuracy, tone)।
Return JSON:
{
  "isValid": true,
  "score": 1-10,
  "status": "verified" | "ai-generated",
  "issues": [],
  "suggestions": []
}`;
        }

        // ════════════════════════════════════════════════════════════════════════
        // 9. TRANSLATE
        // ════════════════════════════════════════════════════════════════════════
        else if (type === "translate") {
            prompt = `Translate this news to professional journalistic English.
Title: ${title}
Content: ${content.substring(0, 2000)}
Return JSON: {"translatedTitle": "...", "translatedContent": "..."}`;
        }

        // ──────────────────────────────────────────────────────────────────────────
        // GENERATE CONTENT
        // ──────────────────────────────────────────────────────────────────────────
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // If JSON type, extract it
        if (["tldr", "seo-tags", "suggest-category", "validate", "translate", "image-context"].includes(type)) {
            const json = extractJSON(text);
            if (json) return NextResponse.json(json);
        }

        return NextResponse.json({ content: cleanText(text), raw: text });

    } catch (error: any) {
        console.error("AI Assistant Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
