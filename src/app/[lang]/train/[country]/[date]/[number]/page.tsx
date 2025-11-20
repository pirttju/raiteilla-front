import { getTrainDetails, getTrainComposition } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';

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

  // Determine start time from the first schedule entry
  const firstStop = train.schedule[0];
  const startTimeStr = firstStop.actual_departure || firstStop.departure;
  const startTime = startTimeStr 
    ? new Date(startTimeStr).toLocaleTimeString(lang, {hour:'2-digit', minute:'2-digit'}) 
    : '';

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded shadow p-6 mb-6 border-l-4 border-blue-600">
        {/* 1. Time and Route */}
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          {startTime} {train.origin_name} &rarr; {train.destination_name}
        </h1>

        {/* 2. Train Type and Number */}
        <div className="text-xl font-semibold text-blue-800 mb-1">
          {train.train_type} {train.train_number}
        </div>

        {/* 3. Company and Date */}
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

          <div className="space-y-10">
            {compositions.map((comp, idx) => {
              // Extract vehicles and REVERSE the array so Location 1 is on the RIGHT
              const vehicles = comp.groups.flatMap(g => g.vehicles);
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
                    {/* CHANGED: 'justify-start' to align left */}
                    <div className="flex gap-1 items-end min-w-max px-2 justify-start">
                      {reversedVehicles.map((v, vIdx) => {
                        const isLoco = v.vehicle_type === 'locomotive';
                        
                        return (
                          <div 
                            key={vIdx} 
                            className={`
                              relative flex flex-col items-center justify-center 
                              border-2 rounded-lg shadow-sm transition hover:scale-105
                              ${isLoco 
                                ? 'bg-gray-800 text-white border-gray-900 w-28 h-16 rounded-tr-[30px]' 
                                : 'bg-vr-green/10 border-vr-green w-24 h-14' 
                              }
                            `}
                          >
                            {/* Connector line */}
                            {vIdx > 0 && (
                              <div className="absolute -left-2 bottom-4 w-2 h-1 bg-gray-400" />
                            )}
                            
                            {/* Car Number (Sales Number) */}
                            {v.sales_number && (
                              <span className={`text-lg font-bold mb-1 ${isLoco ? 'text-yellow-400' : 'text-vr-green'}`}>
                                {v.sales_number}
                              </span>
                            )}
                            
                            {/* Technical ID */}
                            <span className={`text-xs ${isLoco ? 'text-gray-400' : 'text-gray-500'}`}>
                               {v.vehicle_number} 
                            </span>

                            {/* Wheels decoration */}
                            <div className="absolute -bottom-2 flex justify-between w-full px-2">
                              <div className="w-3 h-3 bg-gray-800 rounded-full" />
                              <div className="w-3 h-3 bg-gray-800 rounded-full" />
                            </div>
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
                    
                    {/* Arrival */}
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

                    {/* Departure */}
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

                    {/* Platform */}
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