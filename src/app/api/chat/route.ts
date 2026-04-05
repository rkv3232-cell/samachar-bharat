import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "AI Assistant configuration missing." }, { status: 500 });
        }

        // Fetch latest comprehensive news across categories to provide rich context
        let newsContext = "";
        try {
            const postsSnapshot = await adminDb.collection('posts')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(50) // Increased limit to 50 for advanced analytical capabilities
                .get();

            let categoryMap: Record<string, any[]> = {};

            postsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!categoryMap[data.category]) categoryMap[data.category] = [];
                categoryMap[data.category].push({
                    title: data.title,
                    summary: data.content ? data.content.substring(0, 200) : "",
                    id: doc.id
                });
            });

            // Format grouped by category
            let formattedNews = "";
            for (const [cat, posts] of Object.entries(categoryMap)) {
                formattedNews += `\n[श्रेणी: ${cat.toUpperCase()}]\n`;
                posts.slice(0, 10).forEach(p => {
                    formattedNews += `- ${p.title}\n  सार: ${p.summary}...\n`;
                });
            }

            newsContext = `ताज़ा खबरों का डेटाबेस (Latest News Context):\n${formattedNews}\n\n`;
        } catch (dbError) {
            console.error("Firestore Fetch error for AI:", dbError);
        }

        const SYSTEM_PROMPT = `आप 'Samachar Bharat' के एक अत्यधिक उन्नत (Advanced) और पेशेवर AI News Analyst हैं। 
आपकी पहचान: "नमस्ते! मैं Samachar Bharat का एडवांस AI असिस्टेंट हूँ। मैं आपको ताज़ा ख़बरें, गहराई से विश्लेषण, और ट्रेंडिंग टॉपिक्स की जानकारी दे सकता हूँ।"

आपकी मुख्य क्षमताएं (Capabilities):
1. **विस्तृत विश्लेषण (Deep Analysis)**: केवल ख़बरें न बताएं, बल्कि उनका प्रभाव और कारण भी समझाएं।
2. **कैटेगराइज़ेशन (Categorization)**: यूज़र की रुचि के अनुसार (जैसे- राजनीति, खेल, मनोरंजन) स्पष्ट रूप से न्यूज़ बांटकर दें।
3. **प्रोफेशनल टोन (Professional Tone)**: आपकी भाषा एक वरिष्ठ पत्रकार और विश्लेषक जैसी सभ्य, स्पष्ट और ज्ञानवर्धक होनी चाहिए। 
4. **Markdown Formatting**: अपने जवाबों को सुंदर बनाने के लिए हमेशा **Bold text**, bullet points, और सूचियों का उपयोग करें। महत्वपूर्ण पॉइंट्स को हाईलाइट करें।
5. **भाषा (Language)**: हमेशा हिंदी में उत्तर दें (जब तक कि अंग्रेज़ी में न पूछा जाए)। 
6. **संदर्भ (Context)**: नीचे दिए गए ताज़ा ख़बरों के डेटाबेस का उपयोग करें। यदि यूज़र कोई ऐसी ख़बर पूछता है जो डेटाबेस में नहीं है, तो विनम्रता से बताएं कि अभी इसकी पुष्टि नहीं हुई है।

${newsContext}

उपयोगकर्ता के सवाल का पेशेवर, लंबा और सटीक जवाब दें।`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_PROMPT
        });

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 2000, // Increased for detailed analysis
                temperature: 0.7,      // balanced response
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({
            error: "AI Assistant is temporarily unavailable due to high demand."
        }, { status: 500 });
    }
}
