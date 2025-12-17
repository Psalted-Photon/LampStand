'use client';

import { NewsArticle } from '@/lib/types';

interface ArticleListProps {
  articles: NewsArticle[];
  onArticleSelect: (article: NewsArticle) => void;
  loading: boolean;
}

// Helper to strip HTML tags and decode entities
function stripHtml(html: string): string {
  if (!html) return '';
  
  // Decode HTML entities
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  const decoded = txt.value;
  
  // Remove HTML tags
  const stripped = decoded.replace(/<[^>]*>/g, '');
  
  return stripped;
}

// Helper to extract image from HTML content
function extractImage(html: string): string | null {
  if (!html) return null;
  
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

export default function ArticleList({ articles, onArticleSelect, loading }: ArticleListProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Loading articles...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No articles found. Click a category to load news.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {articles.map((article, index) => {
        const imageUrl = article.urlToImage || extractImage(article.description || '');
        let cleanDescription = stripHtml(article.description || '');
        const cleanTitle = stripHtml(article.title || '');
        
        // Remove title from description if it starts with it
        if (cleanDescription.toLowerCase().startsWith(cleanTitle.toLowerCase())) {
          cleanDescription = cleanDescription.substring(cleanTitle.length).trim();
        }
        
        // Remove common RSS suffixes
        cleanDescription = cleanDescription
          .replace(/The post .+ appeared first on .+\.$/, '')
          .trim();
        
        return (
          <button
            key={index}
            onClick={() => onArticleSelect(article)}
            className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex gap-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={cleanTitle}
                  className="w-24 h-24 object-cover rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                  {cleanTitle}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {cleanDescription}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{article.source.name}</span>
                  <span>•</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
