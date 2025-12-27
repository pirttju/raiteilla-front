import TrainMap from '@/components/TrainMap';
import { getDictionary } from '@/lib/dictionary';

export default async function MapPage({ 
  params 
}: { 
  params: Promise<{ lang: string }> 
}) {
  const { lang } = await params; // Await here
  const dict = await getDictionary(lang);
  
  return <TrainMap dict={dict} />;
}