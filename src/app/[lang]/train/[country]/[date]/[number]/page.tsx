import { getTrainDetails, getTrainComposition } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';
import Image from 'next/image';
import { Ban } from 'lucide-react';

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

  // Create a lookup map: Station Code -> Station Name
  const stationNameMap = new Map<string, string>();
  train.schedule.forEach((stop) => {
    stationNameMap.set(stop.station, stop.name);
  });

  // Helper to get name safely
  const getStationName = (code: string) => stationNameMap.get(code) || code;

  // Determine start time
  const firstStop = train.schedule[0];
  const startTimeStr = firstStop.actual_departure || firstStop.departure;
  const startTime = startTimeStr 
    ? new Date(startTimeStr).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'}) 
    : '';

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded shadow p-6 mb-6 border-l-4 border-blue-600">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          {startTime} {train.origin_name} &rarr; {train.destination_name}
        </h1>
        <div className="text-xl font-semibold text-blue-800 mb-1">
          {train.train_type} {train.train_number}
        </div>
        <div className="text-sm text-gray-500 tracking-wide">
          {train.company} • {new Date(date).toLocaleDateString(lang)}
        </div>
      </div>

      {/* COMPOSITIONS */}
      {compositions && compositions.length > 0 && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>🚂</span> {dict.train.composition}
          </h2>

          <div className="space-y-12">
            {compositions.map((comp, idx) => {
              const vehicles = comp.groups.flatMap(g => g.vehicles);
              const hasLocomotive = vehicles.some(v => v.vehicle_type === 'locomotive');
              
              // Reverse for visualization (Head on the RIGHT)
              const reversedVehicles = [...vehicles].reverse();

              return (
                <div key={idx} className="relative">
                  {/* Leg Header */}
                  <div className="mb-4 pb-2 border-b flex justify-between items-end">
                    <h3 className="font-bold text-lg text-blue-900">
                      {getStationName(comp.begin_station_short_code)} &rarr; {getStationName(comp.end_station_short_code)}
                    </h3>
                    <div className="text-xs text-gray-500 font-mono">
                      {comp.maximum_speed} km/h • {comp.total_length}m
                    </div>
                  </div>

                  {/* Train Visualization */}
                  <div className="overflow-x-auto pb-4">
                    <div className="flex items-start min-w-max px-2 justify-start py-2">
                      {reversedVehicles.map((v, vIdx) => {
                        const isLocoType = v.vehicle_type === 'locomotive';
                        let iconSrc = '/wagon.svg';

                        if (hasLocomotive) {
                          if (isLocoType) iconSrc = '/locomotive.svg';
                        } else {
                          if (reversedVehicles.length === 1) {
                            iconSrc = '/wagon_round.svg';
                          } else if (vIdx === reversedVehicles.length - 1) {
                            iconSrc = '/wagon_front.svg';
                          } else if (vIdx === 0) {
                            iconSrc = '/wagon_rear.svg';
                          }
                        }

                        // Check for No-Entry condition (990-999)
                        const salesNumInt = parseInt(v.sales_number || '0', 10);
                        const isNoEntry = salesNumInt >= 990 && salesNumInt <= 999;

                        return (
                          <div 
                            key={vIdx} 
                            className="flex flex-col items-center -ml-1 first:ml-0 shrink-0 group z-0 hover:z-10 transition-transform hover:scale-105"
                          >
                            {/* Icon Container */}
                            <div 
                              className="relative w-16 h-8"
                              style={{ position: 'relative', width: '64px', height: '32px' }}
                            >
                              <Image 
                                src={iconSrc} 
                                alt={v.vehicle_type} 
                                width={64}
                                height={32}
                                priority
                                className="object-contain z-10" 
                                style={{ width: '64px', height: '32px' }}
                              />

                              {/* Overlay: Sales Number OR No-Entry Icon */}
                              {v.sales_number && (
                                <div 
                                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                                  style={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    left: 0, 
                                    width: '100%', 
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {isNoEntry ? (
                                    <div className="bg-white/90 rounded-full p-0.5 shadow-sm flex items-center justify-center">
                                      {/* Added explicit color prop to force red */}
                                      <Ban 
                                        className="w-4 h-4" 
                                        color="#dc2626" 
                                        strokeWidth={3} 
                                      />
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

                            {/* Technical Number */}
                            <span className="text-[10px] text-gray-600 font-mono mt-1 leading-none">
                              {v.vehicle_number}
                            </span>
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
                <th className="p-3 text-right">{dict.station.arrivals}</th>
                <th className="p-3 text-right">{dict.station.departures}</th>
                <th className="p-3 text-center">{dict.station.track}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {train.schedule.map((stop, idx) => {
                const isPast = stop.actual_departure ? new Date(stop.actual_departure) < new Date() : false;
                
                return (
                  <tr key={idx} className={`hover:bg-blue-50 transition ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                    <td className="p-3 font-medium">
                      {stop.name}
                      {stop.commercial_stop === false && <span className="ml-2 text-xs text-gray-400 italic">(Tech stop)</span>}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <div className={stop.cancelled_arrival ? 'line-through text-red-500' : ''}>
                        {stop.actual_arrival 
                          ? <span className={stop.arrival && stop.actual_arrival !== stop.arrival ? 'text-red-600 font-bold' : ''}>
                              {new Date(stop.actual_arrival).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'})}
                            </span>
                          : stop.arrival 
                            ? new Date(stop.arrival).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'}) 
                            : <span className="text-gray-300">-</span>
                        }
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono">
                       <div className={stop.cancelled_departure ? 'line-through text-red-500' : ''}>
                        {stop.actual_departure 
                          ? <span className={stop.departure && stop.actual_departure !== stop.departure ? 'text-red-600 font-bold' : ''}>
                              {new Date(stop.actual_departure).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'})}
                            </span>
                          : stop.departure 
                            ? new Date(stop.departure).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'}) 
                            : <span className="text-gray-300">-</span>
                        }
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-blue-800">
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