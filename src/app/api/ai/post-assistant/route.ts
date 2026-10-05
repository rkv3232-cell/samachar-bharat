import { NextResponse } from "next/server";
import { executeAITask, cleanAIText, extractStructuredJSON, AITaskType } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { title = "", content = "", type } = await req.json();

    if (!type) {
      return NextResponse.json({ error: "Missing task type." }, { status: 400 });
    }

    let taskType: AITaskType = "article-generation";
    let prompt = "";
    let systemPrompt = `आप 'समाचार भारत' न्यूज़ पोर्टल के वरिष्ठ डिजिटल संपादक और पत्रकार हैं।
नियम:
1. कोई अभिवादन (Greetings) या परिचय न लिखें।
2. कोई पूर्व-योजना (Plan/Thinking) न लिखें।
3. केवल अंतिम परिणाम (Final Result) ही प्रदान करें।
4. हिंदी पत्रकारिता की शुद्ध, तथ्यपरक और प्रभावशाली भाषा का प्रयोग करें।`;
    let isJsonOutput = false;

    if (type === "content") {
      taskType = "article-generation";
      prompt = `शीर्षक: ${title}
अतिरिक्त संदर्भ: ${content || "नवीनतम घटनाक्रम"}
मिशन: इस शीर्षक पर एक विस्तृत और गंभीर न्यूज़ खबर लिखें।
अनिवार्य संरचना (HTML format में):
<h2>मुख्य सुर्खी</h2>
<p>खबर का मुख्य विवरण और पृष्ठभूमि...</p>
<h3>प्रमुख बिंदु और हाइलाइट्स</h3>
<ul><li>पहला महत्वपूर्ण बिंदु</li><li>दूसरा महत्वपूर्ण बिंदु</li><li>तीसरा महत्वपूर्ण बिंदु</li></ul>
<p>आगे की कार्रवाई और निष्कर्ष...</p>`;
    } else if (type === "rewrite") {
      taskType = "article-rewrite";
      prompt = `मूल शीर्षक: ${title}
मूल सामग्री: ${content}
मिशन: इस खबर को और बेहतर, गंभीर, पेशेवर और प्रभावशाली तरीके से फिर से लिखें। तथ्यों को न बदलें। HTML फॉर्मेट का ही उपयोग करें (<h2>, <p>, <h3>, <ul>, <li>)।`;
    } else if (type === "tldr") {
      taskType = "tldr";
      isJsonOutput = true;
      prompt = `खबर: शीर्षक: ${title} | विवरण: ${content.substring(0, 2000)}
मिशन: खबर का सार (TL;DR) 3-4 संक्षिप्त और महत्वपूर्ण बुलेट पॉइंट्स में दें।
JSON Array प्रारूप में उत्तर दें: ["पहला बिंदु", "दूसरा बिंदु", "तीसरा बिंदु", "चौथा बिंदु"]`;
    } else if (type === "seo-tags") {
      taskType = "seo-tags";
      isJsonOutput = true;
      prompt = `खबर: शीर्षक: ${title} | विवरण: ${content.substring(0, 1200)}
मिशन: इस खबर के लिए SEO टैग्स, मेटा डिस्क्रिप्शन और यूआरएल स्लग जनरेट करें।
JSON प्रारूप:
{
  "tags": ["टैग 1", "टैग 2", "टैग 3", "टैग 4", "टैग 5"],
  "seoDescription": "150 अक्षरों के अंदर आकर्षक मेटा डिस्क्रिप्शन",
  "slug": "english-url-slug-here",
  "suggestedCategory": "desh"
}`;
    } else if (type === "headline") {
      taskType = "headline";
      prompt = `सामग्री: ${content.substring(0, 1500)}
मौजूदा शीर्षक (यदि कोई हो): ${title}
मिशन: इस खबर के लिए एक सटीक, आकर्षक और क्लिक-योग्य हिंदी हेडलाइन लिखें। केवल हेडलाइन ही लिखें, कोई अतिरिक्त टिप्पणी न दें।`;
    } else if (type === "suggest-category") {
      taskType = "suggest-category";
      isJsonOutput = true;
      prompt = `शीर्षक: ${title}
विवरण: ${content.substring(0, 800)}
मिशन: इस खबर के लिए उपयुक्त श्रेणी चुनें।
मान्य श्रेणियां: uttar-pradesh | desh | videsh | karobar | crime | dharm | rajniti | lifestyle | sports | entertainment | technology | world
JSON प्रारूप: { "category": "चयनित-श्रेणी" }`;
    } else if (type === "translate") {
      taskType = "translation";
      isJsonOutput = true;
      prompt = `Title: ${title}
Content: ${content.substring(0, 1800)}
Mission: Translate this Hindi news report into professional, journalistic English.
JSON format:
{
  "translatedTitle": "English Headline",
  "translatedContent": "<p>English journalistic paragraphs in HTML format...</p>"
}`;
    } else if (type === "validate") {
      taskType = "fact-check";
      isJsonOutput = true;
      prompt = `शीर्षक: ${title}
सामग्री: ${content.substring(0, 2000)}
मिशन: इस खबर की गुणवत्ता, व्याकरण, तथ्यपरकता और विश्वसनीयता की समीक्षा करें।
JSON प्रारूप:
{
  "isValid": true,
  "score": 8,
  "status": "verified",
  "issues": ["मुद्दा 1 यदि कोई हो"],
  "suggestions": ["सुझाव 1"]
}`;
    } else {
      return NextResponse.json({ error: "Invalid task type specified." }, { status: 400 });
    }

    if (isJsonOutput) {
      systemPrompt += "\nअनिवार्य नियम: केवल और केवल शुद्ध वैध JSON प्रारूप में उत्तर दें। कोई अतिरिक्त विवरण, टिप्पणी या बातचीत न लिखें।";
    }

    // Execute via central AI router (Gemini Primary -> OpenRouter Fallback)
    const aiResponse = await executeAITask({
      task: taskType,
      prompt,
      systemPrompt,
      jsonOutput: isJsonOutput,
    });

    const rawText = aiResponse.text;

    // Handle JSON return types
    if (["tldr", "seo-tags", "suggest-category", "validate", "translate"].includes(type)) {
      const parsed = aiResponse.json || extractStructuredJSON(rawText);
      if (parsed) {
        if (type === "seo-tags" && Array.isArray(parsed)) {
          return NextResponse.json({
            tags: parsed,
            seoDescription: `${title || "ताज़ा समाचार"} - विस्तृत कवरेज और विश्लेषण पढ़ें समाचार भारत पर।`,
            slug: (title || "").toLowerCase().replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || `news-${Date.now()}`,
          });
        }
        return NextResponse.json(parsed);
      }
      console.warn(`[Post Assistant] JSON parse fallback failed for ${type}. Raw:`, rawText);
    }

    // Specific handling for headline
    if (type === "headline") {
      const cleanedHeadline = cleanAIText(rawText);
      return NextResponse.json({
        headline: cleanedHeadline,
        content: cleanedHeadline,
        provider: aiResponse.provider,
        model: aiResponse.model,
      });
    }

    // General text / html content
    const cleanedContent = cleanAIText(rawText);
    return NextResponse.json({
      content: cleanedContent,
      raw: rawText,
      provider: aiResponse.provider,
      model: aiResponse.model,
      fallbackUsed: aiResponse.fallbackUsed,
      version: "v4-gemini-primary",
    });
  } catch (error: any) {
    console.error("Post Assistant Route Error:", error);
    return NextResponse.json(
      { error: error.message || "AI सेवा से उत्तर प्राप्त नहीं हो सका।" },
      { status: error.statusCode || 500 }
    );
  }
}
