'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { findStations, getFlag } from '@/lib/api';
import type { Station } from '@/types/api';

interface SearchBoxProps {
  lang: string;
}

type SuggestionItem = { type: 'station'; data: Station };

export default function SearchBox({ lang }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // 1. Clear suggestions if query is too short
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let active = true;

    // 2. Debounce API call
    const debounceTimer = setTimeout(async () => {
      try {
        const stationData = await findStations(query);
        
        if (active && stationData) {
          const mappedStations: SuggestionItem[] = stationData
            .slice(0, 10) // Limit results
            .map(s => ({ type: 'station', data: s }));
          
          setSuggestions(mappedStations);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [query]);

  const handleSelect = (item: SuggestionItem) => {
    const feed = item.data.feed_id || 'fi';
    const date = new Date().toISOString().split('T')[0];

    // Navigate to station page
    router.push(`/${lang}/station/${feed}/${item.data.short_code}/${date}`);
    
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        className="w-full p-3 border rounded shadow text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        placeholder="🔍"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {suggestions.length > 0 && (
        <ul className="absolute w-full bg-white border mt-1 rounded shadow-lg z-10 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
          {suggestions.map((item, idx) => (
            <li 
              key={idx} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 transition-colors"
              onClick={() => handleSelect(item)}
            >
              <span>{getFlag(item.data.feed_id)}</span>
              <span className="font-bold">{item.data.name}</span>
              <span className="text-gray-500 text-sm dark:text-gray-400">({item.data.commercial_code})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}