import { getTrainDetails, getTrainComposition } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';
import { formatStationTime, checkIsLate } from '@/lib/utils';
import Image from 'next/image';
import lineColoursData from '@/lib/line_colours.json';

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

  if (!train) return <div className="p-8 dark:text-gray-100">{dict.search.trainNotFound || "Train not found"}</div>;

  const stationNameMap = new Map<string, string>();
  train.schedule.forEach((stop) => {
    stationNameMap.set(stop.station, stop.name);
  });

  const getStationName = (code: string) => stationNameMap.get(code) || code;

  const firstStop = train.schedule[0];
  const startTime = formatStationTime(firstStop.departure, country, lang);

  const lineColors = lineColoursData as Record<string, Record<string, string>>;
  let lineBgColor = '#404040';
  if (train.line_no && lineColors[country] && lineColors[country][train.line_no]) {
    lineBgColor = `#${lineColors[country][train.line_no]}`;
  }

  // Reusable classes for dark mode consistency
  const redText = "text-red-600 dark:text-red-400";
  const blueText = "text-blue-600 dark:text-blue-400";

  return (
    <div className="w-full p-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white rounded shadow p-6 mb-6 border-l-4 border-blue-600 dark:bg-gray-800 dark:border-blue-500">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          {startTime} {train.origin_name}&ndash;{train.destination_name}
        </h1>
        
        <div className="text-xl font-semibold text-blue-800 mb-1 flex items-center gap-2 dark:text-blue-300">
          {train.line_no && (
            <span 
              className="inline-flex items-center justify-center px-2 py-0.5 rounded text-white font-bold shadow-sm text-lg min-w-[40px]"
              style={{ backgroundColor: lineBgColor }}
            >
              {train.line_no}
            </span>
          )}
          <span>
            {train.headcode ? train.headcode : train.train_type + ' ' + train.train_number}
          </span>
        </div>
        
        <div className="text-sm text-gray-500 tracking-wide dark:text-gray-400">
          {train.company} • {new Date(date).toLocaleDateString(lang)}
        </div>
      </div>

      {/* Compositions */}
      {compositions && compositions.length > 0 && (
        <div className="bg-white rounded shadow p-6 mb-6 dark:bg-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>🚆</span> {dict.train.composition}
          </h2>

          <div>
            {compositions.map((comp, idx) => {
              const groups = comp.groups; 

              return (
                <div key={idx} className="relative">
                  {/* Leg Header */}
                  <div className="mb-4 pb-2 border-b flex justify-between items-end dark:border-gray-700">
                    <h3 className="font-bold text-lg text-blue-900 dark:text-blue-300">
                      {getStationName(comp.begin_station_short_code)}&ndash;{getStationName(comp.end_station_short_code)}
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {comp.maximum_speed} km/h • {comp.total_length} m
                    </div>
                  </div>

                  {/* Train Visualization */}
                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-end min-w-max px-2 justify-start py-2">
                      
                      {/* Direction Arrow (Left) */}
                      <div className="flex flex-col items-center justify-center mb-4 opacity-50 text-gray-400 dark:text-gray-500">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="m12 19-7-7 7-7"/>
                          <path d="M19 12H5"/>
                        </svg>
                      </div>

                      {/* Iterate Groups */}
                      {groups.map((group, gIdx) => {
                        const vehicles = group.vehicles;
                        const hasLocomotive = vehicles.some(v => v.vehicle_type === 'locomotive');
                        const orderedVehicles = [...vehicles];

                        return (
                          <div 
                            key={gIdx} 
                            className="flex flex-col items-center mx-1 first:ml-0 shrink-0"
                          >
                            {/* VEHICLES ROW */}
                            <div className="flex items-start">
                              {orderedVehicles.map((v, vIdx) => {
                                const isLocoType = v.vehicle_type === 'locomotive';
                                const isEdo = v.vehicle_number === 'Edo';
                                const isDm12 = v.vehicle_number === 'Dm12';
                                
                                let iconSrc = '/wagon.svg';

                                if (isDm12) {
                                  iconSrc = '/wagon_round.svg';
                                } else if (hasLocomotive) {
                                  if (isLocoType) {
                                    iconSrc = '/locomotive.svg';
                                  } else if (isEdo) {
                                    if (vIdx === 0) iconSrc = '/wagon_front.svg'; 
                                    else if (vIdx === orderedVehicles.length - 1) iconSrc = '/wagon_rear.svg'; 
                                  }
                                } else {
                                  if (orderedVehicles.length === 1) {
                                    iconSrc = '/wagon_round.svg';
                                  } else if (vIdx === 0) {
                                    iconSrc = '/wagon_front.svg';
                                  } else if (vIdx === orderedVehicles.length - 1) {
                                    iconSrc = '/wagon_rear.svg';
                                  }
                                }

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
                                        // The dark:invert works with SVGs that are black line art
                                        className="object-contain z-10 dark:invert" 
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

                                    <span className="text-xs text-gray-600 mt-1 leading-none dark:text-gray-400">
                                      {v.vehicle_number}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Group Number */}
                            {group.group_id && (
                              <div className="mt-2 pt-1 border-t border-gray-300 w-full text-center px-1 dark:border-gray-600">
                                <span className="text-xs text-gray-500 font-bold whitespace-nowrap block dark:text-gray-400">
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

      {/* Schedule */}
      <div className="bg-white rounded shadow p-6 mb-6 dark:bg-gray-800">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🕒</span> {dict.train.timetable}
        </h2>
        <div className="overflow-x-auto bg-white rounded shadow dark:bg-gray-800 dark:shadow-none">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 border-b dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              <tr>
                <th className="p-3">{dict.search.station}</th>
                <th className="p-3 text-center">{dict.station.arrival}</th>
                <th className="p-3 text-center">{dict.station.actual}</th>
                <th className="p-3 text-center">{dict.station.departure}</th>
                <th className="p-3 text-center">{dict.station.actual}</th>
                <th className="p-3 text-center">{dict.station.track}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {train.schedule.map((stop, idx) => {
                const isArrivalLate = checkIsLate(stop.arrival, stop.actual_arrival);
                const isDepartureLate = checkIsLate(stop.departure, stop.actual_departure);
                
                // Determine row text color based on commercial status
                const baseTextColor = stop.commercial_stop === false 
                  ? 'text-gray-400 dark:text-gray-500' 
                  : 'text-gray-900 dark:text-gray-200';

                return (
                  <tr key={idx} className={`hover:bg-blue-50 transition dark:hover:bg-blue-900/20 ${baseTextColor}`}>
                    <td className="p-3 font-medium">
                      {stop.name}
                    </td>
                    
                    {/* Scheduled Arrival */}
                    <td className="p-3 text-center">
                      <div className={stop.cancelled_arrival ? `line-through ${redText}` : ''}>
                        {formatStationTime(stop.arrival, country, lang)}
                      </div>
                    </td>

                    {/* Actual Arrival */}
                    <td className="p-3 text-center">
                      {stop.actual_arrival 
                          ? <span className={`font-bold ${isArrivalLate ? redText : ''}`}>
                              {formatStationTime(stop.actual_arrival, country, lang)}
                            </span>
                          : '-'}
                    </td>

                    {/* Scheduled Departure */}
                    <td className="p-3 text-center">
                       <div className={stop.cancelled_departure ? `line-through ${redText}` : ''}>
                        {formatStationTime(stop.departure, country, lang)}
                      </div>
                    </td>

                    {/* Actual Departure */}
                    <td className="p-3 text-center">
                      {stop.actual_departure 
                          ? <span className={`font-bold ${isDepartureLate ? redText : ''}`}>
                              {formatStationTime(stop.actual_departure, country, lang)}
                            </span> : '-'}
                    </td>

                    <td className={`p-3 text-center font-bold ${blueText}`}>
                      {stop.platform || '-'}
                    </td>
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