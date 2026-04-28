import { NextResponse } from "next/server";
import { addPost } from "@/lib/posts";

// ─────────────────────────────────────────────────────────────────────────────
// MISSION: Autonomous WhatsApp News Pipeline
// This endpoint receives raw text (e.g. from a WhatsApp bot/webhook)
// and uses AI to turn it into a professional, published news article.
// ─────────────────────────────────────────────────────────────────────────────

function extractJSON(raw: string): any {
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
        const { message, mediaUrl, secret } = await req.json();

        // 1. Basic Security Check
        const ingestSecret = process.env.WHATSAPP_INGEST_SECRET || "sb_default_secret_99";
        if (secret !== ingestSecret) {
            return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
        }

        if (!message) {
            return NextResponse.json({ error: "Missing message content." }, { status: 400 });
        }

        // 2. AI Processing (Groq)
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: "AI Service not configured." }, { status: 500 });
        }

        const prompt = `
            तुम एक न्यूज़ ऑटोमेशन सिस्टम हो। नीचे दिए गए कच्चे व्हाट्सएप मैसेज (WhatsApp message) को एक प्रोफेशनल न्यूज़ आर्टिकल में बदलो।
            
            व्हाट्सएप मैसेज: "${message}"
            
            तुम्हें ये डिटेल्स JSON फॉर्मेट में लौटानी हैं:
            1. title: एक आकर्षक हिंदी सुर्खी।
            2. content: पूरी खबर विस्तार में (HTML tags <p>, <h2>, <h3> के साथ)। पेशेवर हिंदी पत्रकारिता की भाषा का प्रयोग करें।
            3. category: इनमें से एक चुनें: uttar-pradesh | desh | videsh | karobar | crime | dharm | rajniti | lifestyle
            4. tags: 4-5 संबंधित टैग्स (Array).
            5. slug: URL के लिए इंग्लिश स्लॉग (e.g. "delhi-accident-news").
            
            JSON FORMAT ONLY. कोई बातचीत नहीं।
        `;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // Using 8b for faster ingest response
                messages: [
                    { role: "system", content: "You are a professional News Data Extractor. Reply ONLY with JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error("Groq API failed during ingest.");
        }

        const data = await response.json();
        const aiJson = extractJSON(data.choices[0].message.content);

        if (!aiJson || !aiJson.title) {
            throw new Error("Failed to parse AI output for news ingestion.");
        }

        // 3. Save to Firestore
        const postData = {
            title: aiJson.title,
            content: aiJson.content,
            image: mediaUrl || "", // If a media URL was passed from the bot
            category: aiJson.category || "uttar-pradesh",
            tags: aiJson.tags || [],
            slug: aiJson.slug || `${Date.now()}`,
            status: "published",
            isFeatured: false,
            views: 0,
            likes: 0
        };

        const postId = await addPost(postData as any);

        return NextResponse.json({
            success: true,
            id: postId,
            message: "News successfully ingested and published from WhatsApp!",
            data: {
                title: postData.title,
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/post/${postId}`
            }
        });

    } catch (error: any) {
        console.error("WhatsApp Ingest Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
