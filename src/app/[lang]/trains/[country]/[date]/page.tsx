import Link from 'next/link';
import { getAllTrains } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';
import { getNavDates, formatDateDisplay } from '@/lib/utils';

interface PageProps {
  params: {
    lang: string;
    country: string;
    date: string;
  }
}

export default async function TrainsListPage({ params }: PageProps) {
  const { lang, country, date } = params;
  const dict = await getDictionary(lang);
  const trains = await getAllTrains(country as any, date);
  const { prev, next } = getNavDates(date);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow">
        <Link 
          href={`/${lang}/trains/${country}/${prev}`}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          &larr; {dict.common.prevDay}
        </Link>
        
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase">{dict.nav.trains} ({country})</h1>
          <span className="text-gray-600">{formatDateDisplay(date, lang)}</span>
        </div>

        <Link 
          href={`/${lang}/trains/${country}/${next}`}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          {dict.common.nextDay} &rarr;
        </Link>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-4">{dict.search.train}</th>
                <th className="p-4">{dict.station.dest_origin}</th>
                <th className="p-4">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trains.map((train, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition">
                  <td className="p-4 font-medium">
                    <Link 
                      href={`/${lang}/train/${country}/${date}/${train.train_number}`}
                      className="text-blue-600 hover:underline block"
                    >
                      {train.train_type} {train.train_number}
                    </Link>
                    <span className="text-xs text-gray-500">{train.company}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span>{train.origin_name} &rarr;</span>
                      <span className="font-bold">{train.destination_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {train.cancelled ? (
                      <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-red-500 rounded">
                        {dict.train.cancelled}
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs font-bold">OK</span>
                    )}
                  </td>
                </tr>
              ))}
              {trains.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No trains found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}