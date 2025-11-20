import { getDictionary } from '@/lib/dictionary';
import Header from '@/components/Header';
import '../globals.css';

export const metadata = {
  title: 'Raiteilla',
  description: 'Train schedules and compositions',
};

export default async function RootLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const dict = await getDictionary(lang);

  return (
    <html lang={lang}>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <Header dict={dict} lang={lang} />
        <main>{children}</main>
      </body>
    </html>
  );
}