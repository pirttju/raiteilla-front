import Link from 'next/link';
import { getAllTrains } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';
import { getNavDates, formatDateDisplay } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    lang: string;
    country: string;
    date: string;
  }>;
}

export default async function TrainsListPage({ params }: PageProps) {
  const { lang, country, date } = await params;
  
  const dict = await getDictionary(lang);
  const trains = await getAllTrains(country as any, date);
  const { prev, next } = getNavDates(date);

  return (
    <div className="container mx-auto p-4 max-w-4xl dark:text-gray-100">
      
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow dark:bg-gray-800">
        <Link 
          href={`/${lang}/trains/${country}/${prev}`}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
        >
          &larr; {dict.common.prevDay}
        </Link>
        
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase">{dict.nav.trains} ({country})</h1>
          <span className="text-gray-600 dark:text-gray-400">{formatDateDisplay(date, lang)}</span>
        </div>

        <Link 
          href={`/${lang}/trains/${country}/${next}`}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
        >
          {dict.common.nextDay} &rarr;
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded shadow overflow-hidden dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {/* Table Header */}
            <thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
              <tr>
                <th className="p-4">{dict.search.train}</th>
                <th className="p-4">{dict.station.dest_origin}</th>
                <th className="p-4">Info</th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {trains.map((train, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-blue-50 transition dark:hover:bg-blue-900/20"
                >
                  <td className="p-4 font-medium">
                    <Link 
                      href={`/${lang}/train/${country}/${date}/${train.train_number}`}
                      className="text-blue-600 hover:underline block dark:text-blue-400"
                    >
                      {train.train_type} {train.train_number}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{train.company}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span>{train.origin_name} &rarr;</span>
                      <span className="font-bold">{train.destination_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {train.cancelled ? (
                      <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-red-500 rounded shadow-sm">
                        {dict.train.cancelled}
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs font-bold dark:text-green-400">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}