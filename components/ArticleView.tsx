'use client';

import { NewsArticle, Theme } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'isomorphic-dompurify';

interface ChapterVerse {
  number: number;
  text: string;
}

interface ScriptureData {
  text: string;
  fullChapter?: ChapterVerse[];
  requestedVerses?: number[];
  bookNumber?: number;
  chapterNumber?: number;
}

interface ExpandedChapter {
  verses: ChapterVerse[];
  requestedVerses: number[];
  bookNumber: number;
  chapterNumber: number;
  bookName: string;
}

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
  const [scriptures, setScriptures] = useState<Record<string, ScriptureData>>({});
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<ExpandedChapter | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const highlightRef = useRef<HTMLParagraphElement>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setStreamingText('');
    setAnalysis(null);
    setError('');

    try {
      console.log('Starting analysis for:', article.title);
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

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to analyze article');
      }

      // Check if this is a cached JSON response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const cachedData = await response.json();
        if (cachedData.cached && cachedData.analysis) {
          try {
            // Extract JSON from markdown code blocks if present
            let jsonText = cachedData.analysis;
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
            console.error('Failed to parse cached analysis:', parseError);
            setError('Cached analysis format was unexpected.');
          }
          setAnalyzing(false);
          return;
        }
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
          [reference]: {
            text: data.text || 'Scripture text not available',
            fullChapter: data.fullChapter || [],
            requestedVerses: data.requestedVerses || [],
            bookNumber: data.bookNumber,
            chapterNumber: data.chapterNumber,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch scripture:', err);
    }
  };

  const handleVerseClick = (reference: string, index: number) => {
    const scriptureData = scriptures[reference];
    if (!scriptureData) return;

    // Toggle expansion
    if (expandedIndex === index) {
      setExpandedIndex(null);
      setExpandedChapter(null);
    } else {
      setExpandedIndex(index);
      const bookName = getBookName(scriptureData.bookNumber);
      setExpandedChapter({
        verses: scriptureData.fullChapter || [],
        requestedVerses: scriptureData.requestedVerses || [],
        bookNumber: scriptureData.bookNumber || 1,
        chapterNumber: scriptureData.chapterNumber || 1,
        bookName,
      });
    }
  };

  const getBookName = (bookNumber?: number): string => {
    if (!bookNumber) return '';
    const bookNames = [
      '', 'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
      '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
      'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
      'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
      'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
      '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
      '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
      'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ];
    return bookNames[bookNumber] || '';
  };

  const handleNavigation = async (direction: 'prev' | 'next') => {
    if (!expandedChapter) return;

    setChapterLoading(true);
    try {
      const response = await fetch('/api/scripture/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookNumber: expandedChapter.bookNumber,
          chapter: expandedChapter.chapterNumber,
          direction,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const bookName = getBookName(data.bookNumber);
        setExpandedChapter({
          verses: data.fullChapter || [],
          requestedVerses: [1], // Highlight verse 1 when navigating
          bookNumber: data.bookNumber,
          chapterNumber: data.chapterNumber,
          bookName,
        });
      }
    } catch (err) {
      console.error('Failed to navigate chapter:', err);
    } finally {
      setChapterLoading(false);
    }
  };

  // Auto-scroll to highlighted verse when expanded
  useEffect(() => {
    if (expandedIndex !== null && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [expandedIndex]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-white">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
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
                  <span className="text-gray-600">Analyzing with AI...</span>
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
                
                {analysis.map((theme, themeIndex) => {
                  // Calculate base index for this theme
                  const baseIndex = analysis
                    .slice(0, themeIndex)
                    .reduce((sum, t) => sum + t.passages.length, 0);
                  
                  return (
                    <div key={themeIndex} className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {theme.name}
                      </h3>
                      
                      <div className="space-y-6">
                        {theme.passages.map((passage, passageIndex) => {
                          const globalIndex = baseIndex + passageIndex;
                          const isExpanded = expandedIndex === globalIndex;
                        
                        return (
                          <div key={passageIndex} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start gap-2 mb-3">
                              <h4 
                                onClick={() => scriptures[passage.reference] && handleVerseClick(passage.reference, globalIndex)}
                                className="font-semibold text-blue-700 text-lg cursor-pointer hover:text-blue-900 transition-colors"
                              >
                                {passage.reference}
                              </h4>
                              {passage.isProphetic && (
                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                  Prophetic Parallel
                                </span>
                              )}
                            </div>
                            
                            {scriptures[passage.reference] && !isExpanded && (
                              <div 
                                onClick={() => handleVerseClick(passage.reference, globalIndex)}
                                className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 cursor-pointer hover:bg-blue-100 transition-colors"
                              >
                                <p className="text-gray-800 italic leading-relaxed">
                                  "{scriptures[passage.reference].text}"
                                </p>
                              </div>
                            )}
                            
                            {isExpanded && expandedChapter && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg mb-4 overflow-hidden">
                                {/* Navigation Header */}
                                <div className="flex items-center justify-between p-3 bg-blue-600 text-white">
                                  <button
                                    onClick={() => handleNavigation('prev')}
                                    disabled={chapterLoading}
                                    className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded disabled:opacity-50 text-sm"
                                  >
                                    ← Prev
                                  </button>
                                  <h5 className="font-semibold">
                                    {expandedChapter.bookName} {expandedChapter.chapterNumber}
                                  </h5>
                                  <button
                                    onClick={() => handleNavigation('next')}
                                    disabled={chapterLoading}
                                    className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded disabled:opacity-50 text-sm"
                                  >
                                    Next →
                                  </button>
                                </div>
                                
                                {/* Chapter Content */}
                                <div className="max-h-96 overflow-y-auto p-4 relative">
                                  {chapterLoading && (
                                    <div className="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                  )}
                                  {expandedChapter.verses.map((verse) => {
                                    const isHighlighted = expandedChapter.requestedVerses.includes(verse.number);
                                    return (
                                      <p
                                        key={verse.number}
                                        ref={isHighlighted && verse.number === expandedChapter.requestedVerses[0] ? highlightRef : null}
                                        className={`mb-2 ${isHighlighted ? 'bg-blue-700 text-white' : 'text-gray-800'} p-2 rounded`}
                                      >
                                        <span className="font-semibold mr-2">{verse.number}.</span>
                                        {verse.text}
                                      </p>
                                    );
                                  })}
                                </div>
                                
                                {/* Click to Collapse */}
                                <div 
                                  onClick={() => handleVerseClick(passage.reference, globalIndex)}
                                  className="p-2 text-center bg-blue-100 hover:bg-blue-200 cursor-pointer text-sm text-blue-700 font-medium"
                                >
                                  Click to collapse
                                </div>
                              </div>
                            )}
                            
                            <p className="text-gray-700 leading-relaxed">{passage.connection}</p>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
