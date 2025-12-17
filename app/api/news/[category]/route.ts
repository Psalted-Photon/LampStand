import { NextRequest, NextResponse } from 'next/server';
import { Category, NewsArticle } from '@/lib/types';
import { fetchCategoryNews } from '@/lib/rss-parser';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;

    // Fetch from RSS feeds
    const rssArticles = await fetchCategoryNews(category as Category);

    // Convert RSS articles to NewsArticle format
    const articles: NewsArticle[] = rssArticles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.link,
      urlToImage: article.image || undefined,
      publishedAt: article.pubDate,
      source: { name: article.source },
      content: article.content,
    }));

    return NextResponse.json({ articles, category });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
