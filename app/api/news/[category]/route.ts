import { NextRequest, NextResponse } from 'next/server';
import { Category, NewsArticle } from '@/lib/types';
import { fetchCategoryNews } from '@/lib/rss-parser';
import { saveArticle, getArticleByUrl } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;

    // Fetch from RSS feeds
    const rssArticles = await fetchCategoryNews(category as Category);

    // Convert RSS articles to NewsArticle format and fetch full content
    const articlesPromises = rssArticles.map(async (article) => {
      const newsArticle: NewsArticle = {
        title: article.title,
        description: article.description,
        url: article.link,
        urlToImage: article.image || undefined,
        publishedAt: article.pubDate,
        source: { name: article.source },
        content: article.content,
        fullContent: undefined,
        extractionFailed: false,
      };

      // Check if we have cached full content
      const cachedArticle = getArticleByUrl(article.link);
      
      if (cachedArticle?.full_content) {
        console.log(`Using cached full content for: ${article.title.substring(0, 50)}...`);
        newsArticle.fullContent = cachedArticle.full_content;
        newsArticle.extractionFailed = !!cachedArticle.extraction_failed;
        
        // Prefer cached extracted image over RSS fallback images
        if (cachedArticle.image_url) {
          newsArticle.urlToImage = cachedArticle.image_url;
          console.log(`Using cached extracted image for: ${article.title.substring(0, 50)}...`);
        } else {
          // Re-extract to get image for old cached articles without images
          try {
            const extractResponse = await fetch(`${request.nextUrl.origin}/api/article/extract`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: article.link }),
            });

            const extractData = await extractResponse.json();
            
            if (extractData.success && extractData.image) {
              newsArticle.urlToImage = extractData.image;
              console.log(`Extracted and updated image for cached article: ${article.title.substring(0, 50)}...`);
              
              // Update database with the extracted image
              saveArticle({
                url: article.link,
                category,
                title: article.title,
                content: article.content,
                description: article.description,
                published_at: article.pubDate,
                source_name: article.source,
                full_content: cachedArticle.full_content,
                extraction_failed: 0,
                image_url: extractData.image,
              });
            }
          } catch (error) {
            console.log(`Image re-extraction failed for: ${article.title.substring(0, 50)}...`);
          }
        }
      } else if (cachedArticle?.extraction_failed) {
        console.log(`Extraction previously failed for: ${article.title.substring(0, 50)}...`);
        newsArticle.extractionFailed = true;
      } else {
        // Fetch full content from extraction API
        try {
          const extractResponse = await fetch(`${request.nextUrl.origin}/api/article/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: article.link }),
          });

          const extractData = await extractResponse.json();

          if (extractData.success && extractData.content) {
            newsArticle.fullContent = extractData.content;
            
            // Prefer extracted images over RSS fallback images
            if (extractData.image) {
              newsArticle.urlToImage = extractData.image;
              console.log(`Using extracted image for: ${article.title.substring(0, 50)}...`);
            } else if (!newsArticle.urlToImage) {
              console.log(`No image found for: ${article.title.substring(0, 50)}...`);
            }
            
            // Save to database
            saveArticle({
              url: article.link,
              category,
              title: article.title,
              content: article.content,
              description: article.description,
              published_at: article.pubDate,
              source_name: article.source,
              full_content: extractData.content,
              extraction_failed: 0,
              image_url: extractData.image || null,
            });
          } else {
            console.log(`Extraction failed for: ${article.title.substring(0, 50)}... - ${extractData.error}`);
            newsArticle.extractionFailed = true;
            
            // Save failure state to avoid re-attempting
            saveArticle({
              url: article.link,
              category,
              title: article.title,
              content: article.content,
              description: article.description,
              published_at: article.pubDate,
              source_name: article.source,
              extraction_failed: 1,
            });
          }
        } catch (extractError) {
          console.error(`Error extracting content for ${article.link}:`, extractError);
          newsArticle.extractionFailed = true;
        }
      }

      return newsArticle;
    });

    const articles = await Promise.all(articlesPromises);

    return NextResponse.json({ articles, category });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
