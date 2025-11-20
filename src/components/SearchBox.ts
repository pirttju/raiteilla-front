'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFlag } from '@/lib/api';
import type { Station, Train } from '@/types/api';

interface SearchBoxProps {
  lang: string;
  initialStations: Station[];
}

export default function SearchBox({ lang, initialStations }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const router = useRouter();

  // In a real app, you might fetch trains dynamically. 
  // Here we mock a train search or you'd fetch "today's trains" to filter client side.
  
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

    // Simulate Train search (in reality, fetch API or filter huge list)
    // For this example, if query looks like a number, we show a generic link
    const trainResults = [];
    if (!isNaN(Number(query))) {
        trainResults.push({
            type: 'train',
            data: {
                train_number: parseInt(query),
                feed_id: 'fi', // Defaulting to FI for demo
                train_type: 'Train' 
            }
        });
    }

    setSuggestions([...stationResults, ...trainResults].slice(0, 10));
  }, [query, initialStations]);

  const handleSelect = (item: any) => {
    const date = new Date().toISOString().split('T')[0];
    if (item.type === 'station') {
      router.push(`/${lang}/station/${item.data.feed_id}/${item.data.station}/${date}`);
    } else {
      router.push(`/${lang}/train/${item.data.feed_id}/${date}/${item.data.data.train_number}`);
    }
  };

  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        className="w-full p-3 border rounded shadow text-black"
        placeholder="Search trains or stations..."
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