import { getStationSchedule, getStationInfo } from '@/lib/api';
import Link from 'next/link';

export default async function StationPage({ params }: { params: { lang: string, country: string, id: string, date: string } }) {
  const schedule = await getStationSchedule(params.country as any, params.id, params.date);
  const info = await getStationInfo(params.country as any, params.id);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{info?.name || params.id} ({params.date})</h1>
      
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Train</th>
              <th className="p-3">Dest/Origin</th>
              <th className="p-3">Track</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((train, idx) => {
                // Logic to determine if this row is arrival or departure based on data
                const time = train.departure || train.arrival;
                const isDeparture = !!train.departure;
                
                return (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">
                    {time ? new Date(time).toLocaleTimeString(params.lang, {hour:'2-digit', minute:'2-digit'}) : '-'}
                  </td>
                  <td className="p-3">
                    <Link href={`/${params.lang}/train/${params.country}/${params.date}/${train.train_number}`} className="text-blue-600 font-bold hover:underline">
                      {train.train_type} {train.train_number}
                    </Link>
                  </td>
                  <td className="p-3">
                    {isDeparture ? `→ ${train.destination_name}` : `← ${train.origin_name}`}
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