import Parser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: true }],
            ['enclosure', 'enclosure'],
            ['description', 'description'],
            ['content:encoded', 'contentEncoded']
        ]
    }
});

export interface RSSArticle {
    title: string;
    description: string;
    image: string;
    source: string;
    url: string;
    category?: string;
    publishedAt: string;
}

export async function fetchRssFeeds(): Promise<RSSArticle[]> {
    const feeds = [
        { url: 'https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi', source: 'Google News' },
        { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', source: 'NDTV' },
        { url: 'https://feeds.bbci.co.uk/hindi/rss.xml', source: 'BBC Hindi' }
    ];

    const allNews: RSSArticle[] = [];

    for (const feed of feeds) {
        try {
            const feedData = await parser.parseURL(feed.url);

            const items = feedData.items.map(item => {
                let imageUrl = '';

                // Strategy 1: enclosure
                if (item.enclosure && item.enclosure.url) {
                    imageUrl = item.enclosure.url;
                }
                // Strategy 2: media:content
                else if (item.mediaContent && item.mediaContent.length > 0 && item.mediaContent[0]['$']?.url) {
                    imageUrl = item.mediaContent[0]['$'].url;
                }
                // Strategy 3: parse from HTML description or content
                else {
                    const htmlContent = item.contentEncoded || item.content || item.description || '';
                    const match = htmlContent.match(/<img[^>]+src="([^">]+)"/i);
                    if (match) imageUrl = match[1];
                }

                // Sanitize description
                const rawDesc = item.contentSnippet || item.description || item.content || '';
                const cleanDesc = sanitizeHtml(rawDesc, {
                    allowedTags: [], // Remove all HTML
                    allowedAttributes: {}
                }).trim().replace(/&nbsp;/g, ' ').substring(0, 250);

                // Categorization algorithm (Bonus)
                let category = 'general';
                const textForAnalysis = `${item.title} ${cleanDesc}`.toLowerCase();

                if (textForAnalysis.match(/modi|bjp|congress|rahul gandhi|election|vidhan sabha|lok sabha|kejriwal|politics|सरकार|चुनाव|मोदी|कांग्रेस/)) {
                    category = 'politics';
                } else if (textForAnalysis.match(/market|economy|sensex|nifty|reliance|tata|business|finance|share|व्यापार|बाजार|सेंसेक्स/)) {
                    category = 'business';
                } else if (textForAnalysis.match(/cricket|kohli|bcci|icc|football|messi|olympics|sports|dhoni|रोहित|विराट|क्रिकेट/)) {
                    category = 'sports';
                } else if (textForAnalysis.match(/tech|apple|google|microsoft|ai|smartphone|nasa|space|isro|तकनीक|एआई|अंतरिक्ष/)) {
                    category = 'technology';
                } else if (textForAnalysis.match(/film|bollywood|actor|actress|khan|movie|cinema|netflix|मनोरंजन|सिनेमा|फिल्म/)) {
                    category = 'entertainment';
                } else if (textForAnalysis.match(/world|usa|russia|ukraine|china|pakistan|global|अंतरराष्ट्रीय|विश्व|दुनिया/)) {
                    category = 'world';
                }

                return {
                    title: item.title || 'No Title',
                    description: cleanDesc,
                    image: imageUrl,
                    source: feed.source,
                    url: item.link || '',
                    category: category,
                    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
                };
            });

            allNews.push(...items);
        } catch (error) {
            console.error(`Error fetching RSS feed from ${feed.source}:`, error);
        }
    }

    // Sort by latest published date
    allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Deduplicate by URL
    const uniqueNews: RSSArticle[] = [];
    const seenLinks = new Set();

    for (const news of allNews) {
        if (!seenLinks.has(news.url)) {
            seenLinks.add(news.url);
            if (news.title && news.url) {
                uniqueNews.push(news);
            }
        }
    }

    // Return the top 200 latest articles
    return uniqueNews.slice(0, 200);
}
