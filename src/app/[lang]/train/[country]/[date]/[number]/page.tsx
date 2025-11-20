import { getTrainDetails, getTrainComposition } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';

export default async function TrainPage({ params }: { params: { lang: string, country: string, date: string, number: string } }) {
  const dict = await getDictionary(params.lang);
  const train = await getTrainDetails(params.country as any, params.date, params.number);
  const composition = await getTrainComposition(params.country as any, params.date, params.number);

  if (!train) return <div className="p-8">Train not found</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {train.train_type} {train.train_number} ({train.company})
        </h1>
        <p>{train.origin_name} &rarr; {train.destination_name}</p>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Schedule</h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-2">Station</th>
              <th className="p-2">Arrival</th>
              <th className="p-2">Departure</th>
              <th className="p-2">Track</th>
            </tr>
          </thead>
          <tbody>
            {train.schedule.map((stop, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-2 font-medium">{stop.name}</td>
                <td className="p-2">
                  <div className={stop.cancelled_arrival ? 'line-through text-red-500' : ''}>
                    {stop.actual_arrival ? new Date(stop.actual_arrival).toLocaleTimeString(params.lang, {hour:'2-digit', minute:'2-digit'}) : 
                     stop.arrival ? new Date(stop.arrival).toLocaleTimeString(params.lang, {hour:'2-digit', minute:'2-digit'}) : '-'}
                  </div>
                </td>
                <td className="p-2">
                   <div className={stop.cancelled_departure ? 'line-through text-red-500' : ''}>
                    {stop.actual_departure ? new Date(stop.actual_departure).toLocaleTimeString(params.lang, {hour:'2-digit', minute:'2-digit'}) : 
                     stop.departure ? new Date(stop.departure).toLocaleTimeString(params.lang, {hour:'2-digit', minute:'2-digit'}) : '-'}
                  </div>
                </td>
                <td className="p-2">{stop.platform}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Composition */}
      {composition && composition.groups && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Composition</h2>
          <p className="mb-4">Max Speed: {composition.maximum_speed} km/h | Length: {composition.total_length} m</p>
          <div className="flex gap-2 overflow-x-auto pb-4">
            {composition.groups.flatMap(g => g.vehicles).map((v, i) => (
              <div key={i} className="flex-shrink-0 w-24 h-16 bg-blue-100 border border-blue-300 rounded flex flex-col items-center justify-center">
                <span className="font-bold">{v.vehicle_type}</span>
                <span className="text-xs">{v.vehicle_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}