import { getStationSchedule, getStationInfo } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';
import { formatStationTime, checkIsLate } from '@/lib/utils';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    lang: string;
    country: string;
    id: string;
    date: string;
  }>;
}

export default async function StationPage({ params }: PageProps) {
  const { lang, country, id, date } = await params;

  const dict = await getDictionary(lang);
  const schedule = await getStationSchedule(country as any, id, date);
  const info = await getStationInfo(country as any, id);

  return (
    <div className="container mx-auto p-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-6">{info?.name} ({info?.commercial_code || id})</h1>
      
      <div className="overflow-x-auto bg-white rounded shadow dark:bg-gray-800 dark:shadow-none">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            <tr>
              <th className="p-3 text-center">{dict.station.arrival}</th>
              <th className="p-3 text-center">{dict.station.actual}</th>
              <th className="p-3 text-center">{dict.station.departure}</th>
              <th className="p-3 text-center">{dict.station.actual}</th>
              <th className="p-3">{dict.search.train}</th>
              <th className="p-3">{dict.train.route}</th>
              <th className="p-3 text-center">{dict.station.track}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((train, idx) => {
              const isArrivalLate = checkIsLate(train.arrival, train.actual_arrival);
              const isDepartureLate = checkIsLate(train.departure, train.actual_departure);

              // Standardized color classes for reuse and readability
              const redTextClass = 'text-red-600 dark:text-red-400'; 
              const blueTextClass = 'text-blue-600 dark:text-blue-400';

              return (
                <tr 
                  key={idx} 
                  className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                >
                  {/* Scheduled Arrival */}
                  <td className="p-3 text-center">
                    <div className={train.cancelled_arrival ? `line-through ${redTextClass}` : ''}>
                      {formatStationTime(train.arrival, country, lang)}
                    </div>
                  </td>
                  
                  {/* Actual Arrival */}
                  <td className={`p-3 text-center font-bold ${isArrivalLate ? redTextClass : ''}`}>
                    {formatStationTime(train.actual_arrival, country, lang)}
                  </td>

                  {/* Scheduled Departure */}
                  <td className="p-3 text-center">
                    <div className={train.cancelled_departure ? `line-through ${redTextClass}` : ''}>
                       {formatStationTime(train.departure, country, lang)}
                    </div>
                  </td>

                  {/* Actual Departure */}
                  <td className={`p-3 text-center font-bold ${isDepartureLate ? redTextClass : ''}`}>
                    {formatStationTime(train.actual_departure, country, lang)}
                  </td>

                  <td className="p-3">
                    <Link 
                      href={`/${lang}/train/${country}/${train.departure_date}/${train.train_number}`} 
                      className={`${blueTextClass} font-bold hover:underline`}
                    >
                      {train.train_type} {train.train_number}
                    </Link>
                  </td>
                  <td className="p-3">
                    {train.origin_name}&ndash;{train.destination_name}
                  </td>
                  <td className={`p-3 text-center font-bold ${blueTextClass}`}>
                    {train.platform || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}