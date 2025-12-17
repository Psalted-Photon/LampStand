import { NextRequest, NextResponse } from 'next/server';
import { saveArticle, saveAnalysis, getArticleByUrl, getAnalysisByArticleId } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleText, articleUrl, articleTitle, category } = body;

    if (!articleText) {
      return NextResponse.json(
        { error: 'Article text is required' },
        { status: 400 }
      );
    }

    // Check if we have a cached analysis
    if (articleUrl) {
      const existingArticle = getArticleByUrl(articleUrl);
      if (existingArticle) {
        const cachedAnalysis = getAnalysisByArticleId(existingArticle.id!);
        if (cachedAnalysis) {
          return NextResponse.json({
            cached: true,
            analysis: cachedAnalysis.ollama_response,
          });
        }
      }
    }

    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'qwen2.5:32b';

    const prompt = `You are a neutral analyst connecting current events to biblical themes. Your task is to analyze news articles and identify possible biblical parallels, themes, and relevant scripture passages without promoting any agenda.

For the following news article, provide an exploratory analysis:

1. Identify 3-5 main themes present in the article (e.g., justice, suffering, leadership, conflict, hope, redemption, judgment, mercy, etc.)
2. For each theme, suggest 2-3 relevant Bible passages that connect to it
3. Explain the connection between each passage and the news story
4. If you identify a PROPHETIC PARALLEL (a connection to biblical prophecy or eschatological themes), explicitly label it with "PROPHETIC PARALLEL:" before explaining it

Return your response as valid JSON in this exact format:
{
  "themes": [
    {
      "name": "Theme Name",
      "passages": [
        {
          "reference": "Book Chapter:Verse-Verse",
          "connection": "Explanation of how this passage relates to the news",
          "isProphetic": false
        }
      ]
    }
  ]
}

NEWS ARTICLE:
${articleText}

Remember: Be neutral and exploratory. Focus on thematic connections and let the user draw their own conclusions.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              prompt,
              stream: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No reader available');
          }

          let fullResponse = '';
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.response) {
                  fullResponse += json.response;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: json.response })}\n\n`));
                }
                if (json.done) {
                  // Save to database
                  if (articleUrl && articleTitle) {
                    const articleId = saveArticle({
                      url: articleUrl,
                      category: category || 'unknown',
                      title: articleTitle,
                      content: articleText.substring(0, 5000), // Truncate long content
                    });
                    
                    saveAnalysis({
                      article_id: articleId,
                      ollama_response: fullResponse,
                    });
                  }
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`));
                }
              } catch (e) {
                console.error('Error parsing Ollama response line:', e);
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
