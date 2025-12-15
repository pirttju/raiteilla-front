import { CountryCode, Station, StationTrain, Train, TrainComposition, TrainStop } from "@/types/api";

const BASE_URL = "https://raiteilla.fi/api/v1";

// Helper to get flag
export const getFlag = (code: string) => {
  if (code === 'fi') return '🇫🇮';
  if (code === 'se') return '🇸🇪';
  if (code === 'no') return '🇳🇴';
  if (code === 'gb') return '🇬🇧';
  return '🇪🇺';
};

export async function getStations(country: CountryCode = 'fi'): Promise<Station[]> {
  const res = await fetch(`${BASE_URL}/stations/${country}`, { next: { revalidate: 3600 } });
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function getStationInfo(country: CountryCode, shortCode: string) {
  const res = await fetch(`${BASE_URL}/stations/${country}/${shortCode}`, { next: { revalidate: 3600 } });
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function getAllTrains(country: CountryCode, date: string): Promise<Train[]> {
  const res = await fetch(`${BASE_URL}/trains/${country}/${date}`, { next: { revalidate: 60 } });
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function getTrainDetails(country: CountryCode, date: string, number: string): Promise<Train & { schedule: TrainStop[] } | null> {
  const res = await fetch(`${BASE_URL}/trains/${country}/${date}/${number}`, { cache: 'no-store' });
  const json = await res.json();
  return json.success && json.data.length > 0 ? json.data[0] : null;
}

export async function getTrainComposition(country: CountryCode, date: string, number: string): Promise<TrainComposition[]> {
  const res = await fetch(`${BASE_URL}/allocations/${country}/${date}/${number}`, { cache: 'no-store' });
  const json = await res.json();
  // Return the full array of allocations (legs)
  return json.success ? json.data : [];
}

export async function getStationSchedule(country: CountryCode, station: string, date: string): Promise<StationTrain[]> {
  const res = await fetch(`${BASE_URL}/stations/${country}/${station}/${date}`, { cache: 'no-store' });
  const json = await res.json();
  return json.success ? json.data : [];
}