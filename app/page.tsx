'use client';

import { useState } from 'react';
import CategoryTabs from '@/components/CategoryTabs';
import ArticleList from '@/components/ArticleList';
import ArticleView from '@/components/ArticleView';
import ArticlePasteInput from '@/components/ArticlePasteInput';
import { Category, NewsArticle } from '@/lib/types';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>('israel');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [customArticle, setCustomArticle] = useState<NewsArticle | null>(null);

  const fetchArticles = async (category: Category) => {
    setLoading(true);
    setSelectedArticle(null);
    setCustomArticle(null);
    
    try {
      const response = await fetch(`/api/news/${category}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category);
    fetchArticles(category);
  };

  const handleArticleSelect = (article: NewsArticle) => {
    setSelectedArticle(article);
    setCustomArticle(null);
  };

  const handleCustomArticle = (text: string, title: string) => {
    const customArticle: NewsArticle = {
      title,
      description: text.substring(0, 200) + '...',
      url: 'custom',
      publishedAt: new Date().toISOString(),
      source: { name: 'Custom' },
      content: text,
    };
    setCustomArticle(customArticle);
    setSelectedArticle(null);
  };

  const handleBack = () => {
    setSelectedArticle(null);
    setCustomArticle(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-5xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-milonga)' }}>
            Lampstand
          </h1>
          <p className="mt-2 text-lg text-gray-600" style={{ fontFamily: 'var(--font-cinzel)' }}>
            News & Bible Explorer
          </p>
          <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-baskerville)' }}>
            Explore connections between current events and biblical themes
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedArticle || customArticle ? (
          <ArticleView
            article={selectedArticle || customArticle!}
            category={activeCategory}
            onBack={handleBack}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <ArticlePasteInput onAnalyze={handleCustomArticle} />
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
            <ArticleList
              articles={articles}
              onArticleSelect={handleArticleSelect}
              loading={loading}
            />
          </div>
        )}
      </main>
    </div>
  );
}
