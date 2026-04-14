import { NextResponse } from "next/server";

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
        const { title, content, type, role } = await req.json();

        let prompt = "";

        if (type === "content") {
            prompt = `तुम एक वरिष्ठ हिंदी पत्रकार हो जो "समाचार भारत" न्यूज़ पोर्टल के लिए लिखता है।
            शीर्षक: ${title}
            मिशन: इस शीर्षक पर एक विस्तृत और गंभीर न्यूज़ खबर लिखो।
            अनिवार्य संरचना (HTML format में): 
            <h2>मुख्य सुर्खी</h2>
            <p>खबर का विवरण...</p>
            <h3>हाइलाइट्स</h3>
            <ul><li>बिंदु 1</li><li>बिंदु 2</li></ul>`;
        } else if (type === "tldr") {
            prompt = `खबर का सार (TL;DR) 3-4 बुलेट्स में दें। खबर: ${content.substring(0, 2000)}। JSON array लौटाएं: ["point 1", ...]`;
        } else if (type === "seo-tags") {
            prompt = `खबर के लिए SEO टैग्स, मेटा डिस्क्रिप्शन और स्लॉग जनरेट करें। खबर: ${title} ${content.substring(0, 1000)}। JSON लौटाएं: {"tags": [], "seoDescription": "", "slug": "", "suggestedCategory": ""}`;
        } else if (type === "headline") {
            prompt = `एक सटीक और आकर्षक हिंदी हेडलाइन लिखें। सामग्री: ${content.substring(0, 1500)}। केवल हेडलाइन ही लिखें।`;
        } else if (type === "suggest-category") {
            prompt = `खबर की कैटेगरी चुनें: uttar-pradesh | desh | videsh | karobar | crime | dharm | rajniti | lifestyle. JSON: {"category": "..."}`;
        } else if (type === "translate") {
            prompt = `Translate this news to professional journalistic English. Title: ${title} Content: ${content.substring(0, 1500)}. JSON: {"translatedTitle": "...", "translatedContent": "..."}`;
        } else if (type === "validate") {
            prompt = `इस खबर की गुणवत्ता और तथ्यों की जाँच करें। सामग्री: ${title} ${content.substring(0, 2000)}। 
            JSON लौटाएं: {
                "isValid": true/false,
                "score": 1-10,
                "status": "verified" | "unverified" | "ai-generated",
                "issues": ["मुद्दा 1", ...],
                "suggestions": ["सुझाव 1", ...]
            }`;
        }

        // ─────────────────────────────────────────────────────────
        // 2. AI Provider Selection (Groq or Local)
        // ─────────────────────────────────────────────────────────
        const groqKey = process.env.GROQ_API_KEY;
        const isGroq = !!groqKey;

        const apiTarget = isGroq
            ? "https://api.groq.com/openai/v1/chat/completions"
            : `${process.env.LOCAL_AI_BASE_URL || "http://localhost:1234/v1"}/chat/completions`;

        const modelName = isGroq ? "llama-3.3-70b-versatile" : "local-model";

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (isGroq) headers["Authorization"] = `Bearer ${groqKey}`;

        const response = await fetch(apiTarget, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: "You are the Senior Editor of Samachar Bharat. You never mention being an LLM or Gemma; you only act as a part of the Samachar Bharat platform. Follow instructions strictly. If asked for JSON, return ONLY valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AI API Error:", errorText);
            throw new Error(`AI API Error: ${errorText}`);
        }

        const data = await response.json();
        const text = data.choices[0].message.content;

        // If JSON type, extract it
        if (["tldr", "seo-tags", "suggest-category", "validate", "translate"].includes(type)) {
            const json = extractJSON(text);
            if (json) return NextResponse.json(json);
            console.error("Failed to extract JSON from AI response:", text);
        }

        // Specific handling for headline to match frontend
        if (type === "headline") {
            return NextResponse.json({ headline: cleanText(text), content: cleanText(text) });
        }

        return NextResponse.json({ content: cleanText(text), raw: text });

    } catch (error: any) {
        console.error("Post Assistant Error:", error);
        return NextResponse.json({ error: error.message || "AI Generator offline." }, { status: 500 });
    }
}

