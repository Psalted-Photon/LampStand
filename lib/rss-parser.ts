import { XMLParser } from 'fast-xml-parser';
import { RSS_FEEDS, RSSArticle } from './rss-feeds';
import { Category } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export async function fetchRSSFeed(url: string): Promise<RSSArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error(`RSS fetch failed for ${url}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const result = parser.parse(xml);

    const items = result.rss?.channel?.item || result.feed?.entry || [];
    const articles: RSSArticle[] = [];

    for (const item of Array.isArray(items) ? items : [items]) {
      // Extract image from various RSS fields with comprehensive checks
      let imageUrl = item.enclosure?.['@_url'] || 
                     item['media:content']?.['@_url'] || 
                     item['media:thumbnail']?.['@_url'] ||
                     item['media:group']?.['media:content']?.['@_url'] ||
                     item['media:group']?.['media:thumbnail']?.['@_url'] ||
                     '';
      
      // Log what fields we found for debugging
      if (url.includes('google') && !imageUrl) {
        console.log('Google News item fields:', Object.keys(item));
      }
      
      // If no direct image, try to extract from content/description
      if (!imageUrl) {
        const content = item['content:encoded'] || item.content || item.description || '';
        
        // Try multiple image extraction patterns
        let imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (!imgMatch) {
          imgMatch = content.match(/<img[^>]+src=([^\s>]+)[^>]*>/i);
        }
        if (!imgMatch) {
          // Try to find any URL that looks like an image
          imgMatch = content.match(/https?:\/\/[^\s<>"]+?\.(?:jpg|jpeg|png|gif|webp)/i);
        }
        
        if (imgMatch) {
          imageUrl = imgMatch[1] || imgMatch[0];
          console.log(`Extracted image from HTML content: ${imageUrl.substring(0, 80)}...`);
        } else if (url.includes('google')) {
          console.log(`No image found in Google News content for: ${(item.title || '').substring(0, 50)}...`);
        }
      } else {
        console.log(`Found image in RSS fields: ${imageUrl.substring(0, 80)}...`);
      }
      
      articles.push({
        title: item.title || '',
        description: item.description || item.summary || '',
        link: item.link?.['@_href'] || item.link || '',
        pubDate: item.pubDate || item.published || new Date().toISOString(),
        source: url.includes('bbc') ? 'BBC' :
                url.includes('nytimes') ? 'NY Times' :
                url.includes('google') ? 'Google News' :
                url.includes('goodnews') ? 'Good News Network' :
                url.includes('timesofisrael') ? 'Times of Israel' :
                url.includes('jpost') ? 'Jerusalem Post' :
                url.includes('politico') ? 'Politico' :
                url.includes('techcrunch') ? 'TechCrunch' :
                url.includes('sciencedaily') ? 'Science Daily' :
                url.includes('startribune') ? 'Star Tribune' :
                'RSS Feed',
        content: item['content:encoded'] || item.content || item.description || item.summary || '',
        image: imageUrl,
      });
    }

    return articles;
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

// Fallback images by category
const CATEGORY_IMAGES: Record<string, string> = {
  israel: 'https://images.unsplash.com/photo-1544477813-f8e1d0b8e1c0?w=400',
  'middle-east': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  international: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400',
  'world-politics': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400',
  'positive-news': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400',
  'us-president': 'https://images.unsplash.com/photo-1580130732478-8b6c9d0d3edf?w=400',
  usa: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400',
  minnesota: 'https://images.unsplash.com/photo-1566404394190-cda8c6209208?w=400',
  technopoly: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
};

export async function fetchCategoryNews(category: Category): Promise<RSSArticle[]> {
  const feeds = RSS_FEEDS[category as keyof typeof RSS_FEEDS] || [];
  const allArticles: RSSArticle[] = [];

  const promises = feeds.map(feedUrl => fetchRSSFeed(feedUrl));
  const results = await Promise.all(promises);
  
  results.forEach(articles => {
    allArticles.push(...articles);
  });

  // Remove duplicates based on title similarity
  const uniqueArticles = allArticles.filter((article, index, self) =>
    index === self.findIndex((a) => 
      a.title.toLowerCase().trim() === article.title.toLowerCase().trim() ||
      a.link === article.link
    )
  );

  // Add fallback images for articles without images
  const fallbackImage = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.international;
  uniqueArticles.forEach(article => {
    if (!article.image || article.image === '') {
      console.log(`Using fallback image for article: ${article.title.substring(0, 50)}...`);
      article.image = fallbackImage;
    }
  });

  // Sort by date (newest first)
  uniqueArticles.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime();
    const dateB = new Date(b.pubDate).getTime();
    return dateB - dateA;
  });

  // Return top 10
  return uniqueArticles.slice(0, 10);
}
