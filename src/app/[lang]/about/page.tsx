import Link from 'next/link';
import { getDictionary } from '@/lib/dictionary';
import { getFlag } from '@/lib/api';

interface PageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function About({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight">
          {dict.about.title}
        </h1>
        
        <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg">
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("fi")}</span>
            <Link href="https://www.fintraffic.fi/">Fintraffic</Link> / <Link href="https://www.digitraffic.fi/">digitraffic.fi</Link>, {dict.about.license} <Link href="https://creativecommons.org/licenses/by/4.0/deed">CC-BY 4.0</Link>
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg">
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("se")}</span>
            <Link href="https://www.trafikverket.se/">Trafikverket</Link>, {dict.about.license} <Link href="https://creativecommons.org/public-domain/cc0/">CC0</Link>
          </p>
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("se")}</span>
            <Link href="https://www.trafiklab.se/api/our-apis/oxyfi/">Oxyfi-Realtidspositionering</Link>, {dict.about.license} <Link href="https://creativecommons.org/public-domain/cc0/">CC0</Link>
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg">
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("no")}</span>
            <Link href="https://www.banenor.no/">Bane NOR</Link>, {dict.about.license} <Link href="https://data.norge.no/nlod/en/2.0">NLOD</Link>
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg">
          <p className="text-lg mb-4">
            <span className="p-2">{getFlag("gb")}</span>
            <Link href="https://www.networkrail.co.uk/">Network Rail Limited</Link>, {dict.about.license} <Link href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/">OGL3</Link>
          </p>
        </div>
      </main>
      
    </div>
  );
}