import SearchBox from '@/components/SearchBox';
import { getDictionary } from '@/lib/dictionary';

export default async function Home({ 
  params 
}: { 
  params: Promise<{ lang: string }> 
}) {
  const { lang } = await params; // Await here
  const dict = await getDictionary(lang);
  
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] px-4">
      <h1 className="text-4xl font-bold mb-8 text-blue-900">Raiteilla</h1>
      <SearchBox lang={lang} />
      <p className="mt-4 text-gray-600">{dict.search.placeholder}</p>
    </div>
  );
}