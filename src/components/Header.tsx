'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
    router.push(newPath);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-blue-900 text-white">
      <div className="text-2xl font-bold">
        <Link href={`/${lang}`}>Raiteilla</Link>
      </div>
      <nav className="flex gap-4 items-center">
        <Link href={`/${lang}/trains/fi/${new Date().toISOString().split('T')[0]}`} className="hover:underline">{dict.nav.trains}</Link>
        <Link href={`/${lang}/map`} className="hover:underline">{dict.nav.map}</Link>
        <Link href={`/${lang}/about`} className="hover:underline">{dict.nav.about}</Link>
        
        <select 
          value={lang} 
          onChange={handleLangChange}
          className="bg-blue-800 border border-blue-600 rounded px-2 py-1"
        >
          <option value="fi">Suomi</option>
          <option value="sv">Svenska</option>
          <option value="no">Norsk</option>
          <option value="en">English</option>
        </select>
      </nav>
    </header>
  );
}