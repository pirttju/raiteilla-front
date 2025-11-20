import { getDictionary } from '@/lib/dictionary';
import Header from '@/components/Header';
import '../globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';

export const metadata = {
  title: 'Raiteilla',
  description: 'Train schedules and compositions',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>; // Params is a Promise now
}) {
  const { lang } = await params; // Await the params
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