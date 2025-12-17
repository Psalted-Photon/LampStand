'use client';

import { Category, CATEGORY_LABELS } from '@/lib/types';

interface CategoryTabsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const categories = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-1 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`
              px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
              ${activeCategory === category
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
              }
            `}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </nav>
    </div>
  );
}
