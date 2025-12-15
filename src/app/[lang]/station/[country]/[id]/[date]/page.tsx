import { getStationSchedule, getStationInfo } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';
// Import the new utility function
import { formatStationTime } from '@/lib/utils';
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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{info?.name} ({info?.commercial_code || id})</h1>
      
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">{dict.station.arrival}</th>
              <th className="p-3">{dict.station.actual}</th>
              <th className="p-3">{dict.station.departure}</th>
              <th className="p-3">{dict.station.actual}</th>
              <th className="p-3">{dict.search.train}</th>
              <th className="p-3">{dict.train.route}</th>
              <th className="p-3">{dict.station.track}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((train, idx) => {
              return (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">
                    <div className={train.cancelled_arrival ? 'line-through text-red-500' : ''}>
                      {/* Usage of external utility */}
                      {formatStationTime(train.arrival, country, lang)}
                    </div>
                  </td>
                  <td className="p-3 font-mono">
                    {formatStationTime(train.actual_arrival, country, lang)}
                  </td>
                  <td className="p-3 font-mono">
                    <div className={train.cancelled_departure ? 'line-through text-red-500' : ''}>
                       {formatStationTime(train.departure, country, lang)}
                    </div>
                  </td>
                  <td className="p-3 font-mono">
                    {formatStationTime(train.actual_departure, country, lang)}
                  </td>
                  <td className="p-3">
                    <Link href={`/${lang}/train/${country}/${train.departure_date}/${train.train_number}`} className="text-blue-600 font-bold hover:underline">
                      {train.train_type} {train.train_number}
                    </Link>
                  </td>
                  <td className="p-3">
                    {train.origin_name}&ndash;{train.destination_name}
                  </td>
                  <td className="p-3">{train.platform || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}