'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { formatStationTime, checkIsLate } from '@/lib/utils';
import { StationTrain } from "@/types/api";

interface StationBoardProps {
  schedule: StationTrain[];
  dict: any;
  country: string;
  lang: string;
  lineColors: Record<string, Record<string, string>>;
}

type TabType = 'arrivals' | 'departures' | 'tracks';

export default function StationBoard({
  schedule,
  dict,
  country,
  lang,
  lineColors,
}: StationBoardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('departures');
  
  // Store "now" in state to prevent hydration mismatches and allow live updates
  const [nowISO, setNowISO] = useState<string>('');

  useEffect(() => {
    // Set initial time on mount
    setNowISO(new Date().toISOString());

    // Update every minute
    const timer = setInterval(() => {
      setNowISO(new Date().toISOString());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getLineColor = (train: StationTrain) => {
    if (train.line_no && lineColors[country] && lineColors[country][train.line_no]) {
      return `#${lineColors[country][train.line_no]}`;
    }
    return '#404040';
  };

  const redTextClass = 'text-red-600 dark:text-red-400';
  const blueTextClass = 'text-blue-600 dark:text-blue-400';

  const data = useMemo(() => {
    // If we haven't mounted yet, return empty or full list (avoid hydration errors)
    if (!nowISO) return [];

    // Helper: Get the "Effective" time for sorting/filtering.
    // Logic: Actual > Estimated > Scheduled.
    // This ensures delayed trains (scheduled in past, actual in future) appear on the board.
    const getEffectiveTime = (train: StationTrain, type: 'arrival' | 'departure') => {
      if (type === 'departure') {
        return train.actual_departure || train.estimated_departure || train.departure;
      } else {
        return train.actual_arrival || train.estimated_arrival || train.arrival;
      }
    };

    // -------------------------------------------------------------------------
    // Shared Filter & Sort Logic
    // -------------------------------------------------------------------------
    const filterAndSort = (type: 'arrival' | 'departure') => {
      return schedule
        .filter(t => {
          // 1. Check existence of the specific schedule field
          const scheduledTime = type === 'departure' ? t.departure : t.arrival;
          if (!scheduledTime) return false;

          // 2. Get effective time (UTC ISO string)
          const effectiveTime = getEffectiveTime(t, type);

          // 3. Filter: Effective Time must be >= Now (UTC String Comparison)
          return effectiveTime && effectiveTime >= nowISO;
        })
        .sort((a, b) => {
          // Sort by effective time
          const timeA = getEffectiveTime(a, type) || '';
          const timeB = getEffectiveTime(b, type) || '';
          return timeA.localeCompare(timeB);
        });
    };

    // --- TAB: DEPARTURES ---
    if (activeTab === 'departures') {
      return filterAndSort('departure').slice(0, 10);
    } 
    
    // --- TAB: ARRIVALS ---
    if (activeTab === 'arrivals') {
      return filterAndSort('arrival').slice(0, 10);
    } 
    
    // --- TAB: TRACKS ---
    if (activeTab === 'tracks') {
      const trackMap = new Map<string, StationTrain>();

      // Get all trains that have ANY future movement (Departure OR Arrival)
      // We prioritize Departure time for the sort, but check Arrival if it terminates here.
      const futureTrains = schedule.filter(t => {
        const depTime = getEffectiveTime(t, 'departure');
        const arrTime = getEffectiveTime(t, 'arrival');
        
        const relevantTime = depTime || arrTime;
        return relevantTime && relevantTime >= nowISO;
      });

      // Sort chronological by their next relevant action
      futureTrains.sort((a, b) => {
        const timeA = getEffectiveTime(a, 'departure') || getEffectiveTime(a, 'arrival') || '';
        const timeB = getEffectiveTime(b, 'departure') || getEffectiveTime(b, 'arrival') || '';
        return timeA.localeCompare(timeB);
      });

      // Pick first train per track
      futureTrains.forEach(train => {
        // Normalize platform: handle nulls or whitespace
        const rawPlatform = train.platform;
        const platformKey = rawPlatform ? rawPlatform.toString().trim() : '?';

        if (!trackMap.has(platformKey)) {
          trackMap.set(platformKey, train);
        }
      });

      // Sort tracks naturally (1, 2, 10... not 1, 10, 2)
      return Array.from(trackMap.entries())
        .sort((a, b) => {
          const keyA = a[0];
          const keyB = b[0];
          if (keyA === '?') return 1;
          if (keyB === '?') return -1;
          return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
        })
        .map(([_, train]) => train);
    }

    return [];
  }, [schedule, activeTab, nowISO, country]);

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 mb-4 overflow-x-auto">
        {(['departures', 'arrivals', 'tracks'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`py-2 px-4 font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab(tab)}
          >
             {tab === 'tracks' 
              ? dict.station.track || 'Track Overview' 
              : `${dict.station[tab] || tab}`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded shadow dark:bg-gray-800 dark:shadow-none min-h-[300px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            <tr>
              {activeTab !== 'departures' && <th className="p-3 text-center w-24">{dict.station.arrival}</th>}
              {activeTab !== 'departures' && <th className="p-3 text-center w-24">{dict.station.actual}</th>}
              
              {activeTab !== 'arrivals' && <th className="p-3 text-center w-24">{dict.station.departure}</th>}
              {activeTab !== 'arrivals' && <th className="p-3 text-center w-24">{dict.station.actual}</th>}
              
              <th className="p-3">{dict.search.train}</th>
              <th className="p-3">{dict.train.route}</th>
              <th className="p-3 text-center">{dict.station.track}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((train, idx) => {
              const isArrivalLate = train.arrival && train.actual_arrival 
                ? checkIsLate(train.arrival, train.actual_arrival) 
                : false;
              const isDepartureLate = train.departure && train.actual_departure 
                ? checkIsLate(train.departure, train.actual_departure) 
                : false;
              const lineBgColor = getLineColor(train);

              return (
                <tr
                  key={`${train.train_number}-${idx}`}
                  className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                >
                  {/* Arrivals */}
                  {activeTab !== 'departures' && (
                    <>
                      <td className="p-3 text-center">
                        {train.arrival ? (
                          <div className={train.cancelled_arrival ? `line-through ${redTextClass}` : ''}>
                            {formatStationTime(train.arrival, country, lang)}
                          </div>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-3 text-center">
                        {train.actual_arrival ? (
                          <span className={`font-bold ${isArrivalLate ? redTextClass : ''}`}>
                            {formatStationTime(train.actual_arrival, country, lang)}
                          </span>
                        ) : train.arrival && train.unknown_arrival ? (
                          <span className={`font-bold ${redTextClass}`}>?</span>
                        ) : train.arrival && train.estimated_arrival ? (
                          <span className="italic">
                            ~{formatStationTime(train.estimated_arrival, country, lang)}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                    </>
                  )}

                  {/* Departures */}
                  {activeTab !== 'arrivals' && (
                    <>
                      <td className="p-3 text-center">
                        {train.departure ? (
                          <div className={train.cancelled_departure ? `line-through ${redTextClass}` : ''}>
                            {formatStationTime(train.departure, country, lang)}
                          </div>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-3 text-center">
                        {train.actual_departure ? (
                          <span className={`font-bold ${isDepartureLate ? redTextClass : ''}`}>
                            {formatStationTime(train.actual_departure, country, lang)}
                          </span>
                        ) : train.departure && train.unknown_departure ? (
                          <span className={`font-bold ${redTextClass}`}>?</span>
                        ) : train.departure && train.estimated_departure ? (
                          <span className="italic">
                            ~{formatStationTime(train.estimated_departure, country, lang)}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                    </>
                  )}

                  <td className="p-3">
                    <Link
                      href={`/${lang}/train/${country}/${train.departure_date}/${train.train_number}`}
                      className={`${blueTextClass} font-bold hover:underline`}
                    >
                      {train.headcode || `${train.train_type} ${train.train_number}`}
                    </Link>
                  </td>
                  <td className="p-3">
                    {train.line_no && (
                      <span
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded text-white font-bold shadow-sm text-xs min-w-[20px] mr-2"
                        style={{ backgroundColor: lineBgColor }}
                      >
                        {train.line_no}
                      </span>
                    )}
                    {train.origin_name}&ndash;{train.destination_name}
                  </td>
                  <td className={`p-3 text-center font-bold ${blueTextClass}`}>
                    {train.platform || '-'}
                  </td>
                </tr>
              );
            })}
            
            {data.length === 0 && (
               <tr>
                 <td colSpan={7} className="p-6 text-center text-gray-500">
                   {!nowISO ? dict.common.loading : dict.common.noData}
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}