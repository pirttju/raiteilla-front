import Link from 'next/link';
import { getDictionary } from '@/lib/dictionary';
import { getFlag, getHealthStatus } from '@/lib/api';
import { HealthStatus } from '@/types/api';

interface PageProps {
  params: Promise<{
    lang: string;
  }>;
}

// Helper component to render health status rows
function StatusList({ items }: { items: HealthStatus[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
      {items.map((item) => {
        // Determine health: Green if seconds is less than threshold
        const isHealthy = item.seconds < item.threshold;
        
        return (
          <div key={item.item} className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {item.item}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono hidden sm:block">
                {Math.round(item.seconds)}s / {item.threshold}s
              </span>
              
              <div 
                className={`w-3 h-3 rounded-full shadow-sm transition-colors duration-300 ${
                  isHealthy 
                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                }`}
                title={`Last update: ${item.seconds}s ago (Threshold: ${item.threshold}s)`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function About({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  // Fetch health status
  const [fiHealth, seHealth, noHealth, gbHealth] = await Promise.all([
    getHealthStatus('fi'),
    getHealthStatus('se'),
    getHealthStatus('no'),
    getHealthStatus('gb'),
  ]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight">
          {dict.about.title}
        </h1>
        
        <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg w-full">
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("fi")}</span>
            <Link href="https://www.fintraffic.fi/">Fintraffic</Link> / <Link href="https://www.digitraffic.fi/">digitraffic.fi</Link>, {dict.about.license} <Link href="https://creativecommons.org/licenses/by/4.0/deed">CC-BY 4.0</Link>
          </p>
          <StatusList items={fiHealth} />
        </div>

        <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg w-full">
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("se")}</span>
            <Link href="https://www.trafikverket.se/">Trafikverket</Link>, {dict.about.license} <Link href="https://creativecommons.org/public-domain/cc0/">CC0</Link>
          </p>
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("se")}</span>
            <Link href="https://www.trafiklab.se/api/our-apis/oxyfi/">Oxyfi-Realtidspositionering</Link>, {dict.about.license} <Link href="https://creativecommons.org/public-domain/cc0/">CC0</Link>
          </p>
          <StatusList items={seHealth} />
        </div>

        <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg w-full">
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("no")}</span>
            <Link href="https://www.banenor.no/">Bane NOR</Link>, {dict.about.license} <Link href="https://data.norge.no/nlod/en/2.0">NLOD</Link>
          </p>
          <StatusList items={noHealth} />
        </div>

        <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg w-full">
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("gb")}</span>
            <Link href="https://www.networkrail.co.uk/">Network Rail Limited</Link>, {dict.about.license} <Link href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/">OGL3</Link>
          </p>
          <StatusList items={gbHealth} />
        </div>
      </main>
      
    </div>
  );
}