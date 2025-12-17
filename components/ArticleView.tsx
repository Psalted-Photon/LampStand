'use client';

import { NewsArticle, Theme } from '@/lib/types';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'isomorphic-dompurify';

interface ArticleViewProps {
  article: NewsArticle;
  category: string;
  onBack: () => void;
}

export default function ArticleView({ article, category, onBack }: ArticleViewProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [analysis, setAnalysis] = useState<Theme[] | null>(null);
  const [error, setError] = useState('');
  const [scriptures, setScriptures] = useState<Record<string, string>>({});

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setStreamingText('');
    setAnalysis(null);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleText: article.fullContent || article.content || article.description || article.title,
          articleUrl: article.url,
          articleTitle: article.title,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze article');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.token) {
                fullText += data.token;
                setStreamingText(fullText);
              }
              
              if (data.done) {
                // Parse the JSON response
                try {
                  // Extract JSON from markdown code blocks if present
                  let jsonText = data.fullResponse || fullText;
                  const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || 
                                   jsonText.match(/```\s*([\s\S]*?)\s*```/);
                  if (jsonMatch) {
                    jsonText = jsonMatch[1];
                  }
                  
                  const parsed = JSON.parse(jsonText);
                  setAnalysis(parsed.themes || []);
                  
                  // Fetch scripture texts
                  if (parsed.themes) {
                    for (const theme of parsed.themes) {
                      for (const passage of theme.passages) {
                        fetchScripture(passage.reference);
                      }
                    }
                  }
                } catch (parseError) {
                  console.error('Failed to parse analysis:', parseError);
                  setError('Analysis completed but response format was unexpected. Raw response: ' + fullText);
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(String(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchScripture = async (reference: string) => {
    try {
      const response = await fetch(`/api/scripture/${encodeURIComponent(reference)}`);
      if (response.ok) {
        const data = await response.json();
        setScriptures(prev => ({
          ...prev,
          [reference]: data.text || 'Scripture text not available',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch scripture:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-lg font-semibold text-gray-900 flex-1">Article View</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <span>{article.source.name}</span>
            <span>•</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>

          {article.urlToImage && (
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}

          {article.extractionFailed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Full article content could not be extracted (possibly paywalled or protected). 
                Showing RSS summary instead.
              </p>
            </div>
          )}

          <div className="prose prose-lg max-w-none mb-6">
            {article.fullContent ? (
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(article.fullContent, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'],
                    ALLOWED_ATTR: ['href', 'target', 'rel']
                  })
                }}
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {article.content || article.description}
              </p>
            )}
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            View full article at source →
          </a>

          <div className="mt-8 pt-8 border-t border-gray-200">
            {!analyzing && !analysis && (
              <button
                onClick={handleAnalyze}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Analyze with Bible
              </button>
            )}

            {analyzing && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-gray-600">Analyzing with Ollama...</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {streamingText}
                  </pre>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                <p className="font-semibold">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">Biblical Analysis</h2>
                
                {analysis.map((theme, themeIndex) => (
                  <div key={themeIndex} className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {theme.name}
                    </h3>
                    
                    <div className="space-y-6">
                      {theme.passages.map((passage, passageIndex) => (
                        <div key={passageIndex} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-start gap-2 mb-2">
                            <h4 className="font-semibold text-blue-700">
                              {passage.reference}
                            </h4>
                            {passage.isProphetic && (
                              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                Prophetic Parallel
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 mb-3">{passage.connection}</p>
                          
                          {scriptures[passage.reference] && (
                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                              <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                                <ReactMarkdown>
                                  {scriptures[passage.reference]}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
