import { getTrainDetails, getTrainComposition } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';
import Image from 'next/image';
import lineColoursData from '@/lib/line_colours.json'; // Import the JSON

interface PageProps {
  params: Promise<{
    lang: string;
    country: string;
    date: string;
    number: string;
  }>;
}

export default async function TrainPage({ params }: PageProps) {
  const { lang, country, date, number } = await params;

  const dict = await getDictionary(lang);
  const train = await getTrainDetails(country as any, date, number);
  const compositions = await getTrainComposition(country as any, date, number);

  if (!train) return <div className="p-8">Train not found</div>;

  const stationNameMap = new Map<string, string>();
  train.schedule.forEach((stop) => {
    stationNameMap.set(stop.station, stop.name);
  });

  const getStationName = (code: string) => stationNameMap.get(code) || code;

  const firstStop = train.schedule[0];
  const startTimeStr = firstStop.actual_departure || firstStop.departure;
  const startTime = startTimeStr 
    ? new Date(startTimeStr).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'}) 
    : '';

  // --- LINE COLOR LOGIC ---
  const lineColors = lineColoursData as Record<string, Record<string, string>>;
  let lineBgColor = '#3b82f6'; // Default fallback color (blue-500) if not found
  
  if (train.line_no && lineColors[country] && lineColors[country][train.line_no]) {
    lineBgColor = `#${lineColors[country][train.line_no]}`;
  }

  return (
    <div className="w-full p-4">
      {/* Header */}
      <div className="bg-white rounded shadow p-6 mb-6 border-l-4 border-blue-600">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          {startTime} {train.origin_name}&ndash;{train.destination_name}
        </h1>
        
        <div className="text-xl font-semibold text-blue-800 mb-1 flex items-center gap-2">
          {/* Render Line Number with Color Box if it exists */}
          {train.line_no && (
            <span 
              className="inline-flex items-center justify-center px-2 py-0.5 rounded text-white font-bold shadow-sm text-lg min-w-[40px]"
              style={{ backgroundColor: lineBgColor }}
            >
              {train.line_no}
            </span>
          )}
          
          <span>
            {train.train_type} {train.train_number}
          </span>
        </div>
        
        <div className="text-sm text-gray-500 tracking-wide">
          {train.company} • {new Date(date).toLocaleDateString(lang)}
        </div>
      </div>

      {/* COMPOSITIONS */}
      {compositions && compositions.length > 0 && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>🚆</span> {dict.train.composition}
          </h2>

          <div className="space-y-12">
            {compositions.map((comp, idx) => {
              const reversedGroups = [...comp.groups].reverse();

              return (
                <div key={idx} className="relative">
                  {/* Leg Header */}
                  <div className="mb-4 pb-2 border-b flex justify-between items-end">
                    <h3 className="font-bold text-lg text-blue-900">
                      {getStationName(comp.begin_station_short_code)} &rarr; {getStationName(comp.end_station_short_code)}
                    </h3>
                    <div className="text-xs text-gray-500 font-mono">
                      {comp.maximum_speed > 0 ? `${comp.maximum_speed} km/h` : ''} 
                      {comp.total_length > 0 ? `${comp.total_length} m` : ''}
                    </div>
                  </div>

                  {/* Train Visualization */}
                  <div className="overflow-x-auto pb-4">
                    <div className="flex items-start min-w-max px-2 justify-start py-2">
                      
                      {/* Iterate Groups */}
                      {reversedGroups.map((group, gIdx) => {
                        const vehicles = group.vehicles;
                        const hasLocomotive = vehicles.some(v => v.vehicle_type === 'locomotive');
                        const reversedVehicles = [...vehicles].reverse();

                        return (
                          <div 
                            key={gIdx} 
                            className="flex flex-col items-center mx-1 first:ml-0 shrink-0"
                          >
                            {/* VEHICLES ROW */}
                            <div className="flex items-start">
                              {reversedVehicles.map((v, vIdx) => {
                                const isLocoType = v.vehicle_type === 'locomotive';
                                const isEdo = v.vehicle_number === 'Edo';
                                
                                let iconSrc = '/wagon.svg';

                                if (hasLocomotive) {
                                  if (isLocoType) {
                                    iconSrc = '/locomotive.svg';
                                  } else if (isEdo) {
                                    if (vIdx === reversedVehicles.length - 1) iconSrc = '/wagon_front.svg';
                                    else if (vIdx === 0) iconSrc = '/wagon_rear.svg';
                                  }
                                } else {
                                  if (reversedVehicles.length === 1) {
                                    iconSrc = '/wagon_round.svg';
                                  } else if (vIdx === reversedVehicles.length - 1) {
                                    iconSrc = '/wagon_front.svg';
                                  } else if (vIdx === 0) {
                                    iconSrc = '/wagon_rear.svg';
                                  }
                                }

                                // No Entry / Closed Logic
                                const salesNumInt = parseInt(v.sales_number || '0', 10);
                                const isNoEntryRange = v.sales_number && salesNumInt >= 990 && salesNumInt <= 999;
                                const isClosed = (v as any).sales_state === "closed"; 
                                const showNoEntry = isNoEntryRange || isClosed;
                                const showOverlay = v.sales_number || showNoEntry;

                                return (
                                  <div 
                                    key={`${gIdx}-${vIdx}`} 
                                    className="flex flex-col items-center mx-0 shrink-0 group z-0 hover:z-10 transition-transform hover:scale-105"
                                  >
                                    <div 
                                      className="relative"
                                      style={{ position: 'relative', width: '64px', height: '32px' }}
                                    >
                                      <Image 
                                        src={iconSrc} 
                                        alt={v.vehicle_type} 
                                        width={64}
                                        height={32}
                                        priority
                                        className="object-contain z-10" 
                                        style={{ width: '64px', height: '32px', objectFit: 'contain' }}
                                      />

                                      {/* Overlay */}
                                      {showOverlay && (
                                        <div 
                                          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                                          style={{ 
                                            position: 'absolute', 
                                            top: 0, left: 0, width: '100%', height: '100%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                          }}
                                        >
                                          {showNoEntry ? (
                                            <div className="bg-white/90 rounded-full p-0.5 shadow-sm flex items-center justify-center">
                                              <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                width="16" height="16" viewBox="0 0 24 24" 
                                                fill="none" stroke="#dc2626" strokeWidth="3" 
                                                strokeLinecap="round" strokeLinejoin="round"
                                              >
                                                <circle cx="12" cy="12" r="10"/>
                                                <path d="m4.9 4.9 14.2 14.2"/>
                                              </svg>
                                            </div>
                                          ) : (
                                            <span 
                                              className="bg-[#fef08a] text-gray-900 px-1.5 py-0.5 rounded shadow-sm border border-gray-300 font-bold text-xs leading-none"
                                              style={{ backgroundColor: '#fef08a' }}
                                            >
                                              {v.sales_number}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <span className="text-[10px] text-gray-600 font-mono mt-1 leading-none">
                                      {v.vehicle_number}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* GROUP ID */}
                            {group.group_id && (
                              <div className="mt-2 pt-1 border-t border-gray-300 w-full text-center px-1">
                                <span className="text-[10px] text-gray-500 font-bold font-mono whitespace-nowrap block">
                                  {group.group_id}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHEDULE */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🕒</span> {dict.station.title.replace('{station}', '')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3">{dict.search.station}</th>
                <th className="p-3 text-right">{dict.station.arrival}</th>
                <th className="p-3 text-right">{dict.station.actual}</th>
                <th className="p-3 text-right">{dict.station.departure}</th>
                <th className="p-3 text-right">{dict.station.actual}</th>
                <th className="p-3 text-center">{dict.station.track}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {train.schedule.map((stop, idx) => {
                const isPast = stop.actual_departure ? new Date(stop.actual_departure) < new Date() : false;
                return (
                  <tr key={idx} className={`hover:bg-blue-50 transition ${stop.commercial_stop === false ? 'text-gray-400' : 'text-gray-900'}`}>
                    <td className="p-3 font-medium">
                      {stop.name}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <div className={stop.cancelled_arrival ? 'line-through text-red-500' : ''}>
                        {stop.arrival ? new Date(stop.arrival).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'}) : '-'}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {stop.actual_arrival 
                          ? <span className={stop.arrival && stop.actual_arrival !== stop.arrival ? 'text-red-600 font-bold' : ''}>
                              {new Date(stop.actual_arrival).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'})}
                            </span>
                          : '-'}
                    </td>
                    <td className="p-3 text-right font-mono">
                       <div className={stop.cancelled_departure ? 'line-through text-red-500' : ''}>
                        {stop.departure ? new Date(stop.departure).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'}) : '-'}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {stop.actual_departure 
                          ? <span className={stop.departure && stop.actual_departure !== stop.departure ? 'text-red-600 font-bold' : ''}>
                              {new Date(stop.actual_departure).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'})}
                            </span> : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-blue-800">{stop.platform || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}