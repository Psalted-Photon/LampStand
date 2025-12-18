import { NextRequest, NextResponse } from 'next/server';
import { extract } from '@extractus/article-extractor';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`Extracting full content from: ${url}`);

    try {
      // Extract article content
      const article = await extract(url);

      if (!article || !article.content) {
        console.log(`No content extracted from: ${url}`);
        return NextResponse.json({
          success: false,
          error: 'Could not extract article content',
          isPaywalled: false,
        });
      }

      // Clean up the extracted content
      const fullContent = article.content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      console.log(`Successfully extracted ${fullContent.length} characters from: ${url}`);
      console.log(`Image found: ${article.image || 'NONE'}`);

      return NextResponse.json({
        success: true,
        content: fullContent,
        title: article.title || '',
        description: article.description || '',
        image: article.image || '',
        published: article.published || '',
      });

    } catch (extractError: any) {
      console.error(`Extraction failed for ${url}:`, extractError.message);

      // Check for common paywall/403 errors
      const isPaywalled = extractError.message?.includes('403') || 
                          extractError.message?.includes('Forbidden') ||
                          extractError.message?.includes('Access Denied');

      return NextResponse.json({
        success: false,
        error: extractError.message || 'Extraction failed',
        isPaywalled,
      });
    }

  } catch (error: any) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
