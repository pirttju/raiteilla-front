'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFlag } from '@/lib/api';
import type { Station } from '@/types/api';
import { getDictionary } from '@/lib/dictionary';

interface SearchBoxProps {
  lang: string;
  initialStations: Station[];
}

export default function SearchBox({ lang, initialStations }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    // Filter Stations
    const stationResults = initialStations
      .filter(s => 
        s.name.toLowerCase().includes(lowerQuery) || 
        s.station.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map(s => ({ type: 'station', data: s }));

    /*
    // TODO: Train search
    const trainResults = [];
    if (!isNaN(Number(query))) {
        trainResults.push({
            type: 'train',
            data: {
                train_number: parseInt(query),
                feed_id: 'fi', 
                train_type: 'Train' 
            }
        });
    }
    
    setSuggestions([...stationResults, ...trainResults].slice(0, 10));
    */

    setSuggestions(stationResults.slice(0, 10));
  }, [query, initialStations]);

  const handleSelect = (item: any) => {
    // Check if feed_id exists, fallback to 'fi' if missing
    const feed = item.data.feed_id || 'fi';

    // TODO: Support time zones based on feed_id
    const date = new Date().toISOString().split('T')[0];

    if (item.type === 'station') {
      router.push(`/${lang}/station/${feed}/${item.data.station}/${date}`);
    } else {
      // TODO: Train search result
      //router.push(`/${lang}/train/${item.data.feed_id}/${date}/${item.data.train_number}`);
    }
  };

  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        className="w-full p-3 border rounded shadow text-black"
        placeholder="🔍"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {suggestions.length > 0 && (
        <ul className="absolute w-full bg-white border mt-1 rounded shadow-lg z-10 text-black">
          {suggestions.map((item, idx) => (
            <li 
              key={idx} 
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => handleSelect(item)}
            >
              {item.type === 'station' ? (
                <>
                  <span>{getFlag(item.data.feed_id)}</span>
                  <span className="font-bold">{item.data.name}</span>
                  <span className="text-gray-500 text-sm">({item.data.station})</span>
                </>
              ) : (
                <>
                   <span>{getFlag(item.data.feed_id || 'fi')}</span>
                   <span className="font-bold">{item.data.train_type} {item.data.train_number}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}