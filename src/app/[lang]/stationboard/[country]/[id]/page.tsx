import { getStationSchedule, getStationInfo } from '@/lib/api';
import { getDictionary } from '@/lib/dictionary';
import lineColoursData from '@/lib/line_colours.json';
import StationBoard from '@/components/StationBoard';
import { getDateInZone } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    lang: string;
    country: string;
    id: string;
  }>;
}

export default async function StationBoardPage({ params }: PageProps) {
  const { lang, country, id } = await params;

  // 1. Calculate dates for today and tomorrow in the target country
  const todayDate = getDateInZone(country);
  const tomorrowDate = getDateInZone(country, 1);

  // 2. Fetch all data in parallel
  // We fetch schedule for today AND tomorrow to ensure we have "next" trains around midnight
  const [dict, info, scheduleToday, scheduleTomorrow] = await Promise.all([
    getDictionary(lang),
    getStationInfo(country as any, id),
    getStationSchedule(country as any, id, todayDate),
    getStationSchedule(country as any, id, tomorrowDate),
  ]);

  // 3. Combine schedules
  // Note: Depending on the API, there might be duplicates if the API returns overlap, 
  // but usually fetching by date returns strict 00:00-23:59 blocks.
  const fullSchedule = [...(scheduleToday || []), ...(scheduleTomorrow || [])];

  const lineColors = lineColoursData as Record<string, Record<string, string>>;

  return (
    <div className="container mx-auto p-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-6">
        {info?.name} ({info?.commercial_code || id})
      </h1>
      
      <StationBoard 
        schedule={fullSchedule}
        dict={dict}
        country={country}
        lang={lang}
        lineColors={lineColors}
      />
    </div>
  );
}