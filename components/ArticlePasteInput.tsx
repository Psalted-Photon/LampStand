'use client';

import { useState } from 'react';

interface ArticlePasteInputProps {
  onAnalyze: (text: string, title: string) => void;
}

export default function ArticlePasteInput({ onAnalyze }: ArticlePasteInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (text.trim() && title.trim()) {
      onAnalyze(text, title);
      setText('');
      setTitle('');
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Paste Custom Article
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border-b border-blue-200 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Paste Article to Analyze</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Article title..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste article text or URL here..."
        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || !title.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Analyze This
        </button>
        <button
          onClick={() => {
            setText('');
            setTitle('');
            setIsExpanded(false);
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
