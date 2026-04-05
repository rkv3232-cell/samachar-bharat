import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // We use Gemini to get financial data because true real-time NSE/Gold APIs are not free.
        // Gemini can search current rates and return them as a clean JSON.
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const prompt = `Return the current market price (as of now) for:
1. Nifty 50 Index (NSE India)
2. Gold Price (24K, per 10g, in INR)
3. USD to INR Exchange Rate

Format the response ONLY as a JSON array like this:
[
  {"name": "Nifty 50", "value": "22,450.30", "change": "+0.45%", "up": true},
  {"name": "Gold (24K)", "value": "71,200", "change": "-120", "up": false},
  {"name": "USD/INR", "value": "83.42", "change": "+0.02", "up": true}
]
Adjust the numbers to reflect current real market estimated prices (approximate is fine but don't just use dummy placeholders).`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        let textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        // Clean up markdown if Gemini returns it
        textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();

        const financeData = JSON.parse(textContent);
        return NextResponse.json(financeData);
    } catch (error) {
        console.error('Finance API Error:', error);
        // Fallback data if API fails
        return NextResponse.json([
            { name: 'Nifty 50', value: '22,462.45', change: '+0.52%', up: true },
            { name: 'Gold (24K)', value: '71,150.00', change: '+320', up: true },
            { name: 'USD/INR', value: '83.38', change: '-0.04', up: false }
        ]);
    }
}
