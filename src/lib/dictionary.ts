import 'server-only';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  fi: () => import('@/dictionaries/fi.json').then((module) => module.default),
  sv: () => import('@/dictionaries/sv.json').then((module) => module.default), // sv for Swedish
  no: () => import('@/dictionaries/no.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  // Map 'se' to 'sv' if file is named sv.json, or use 'se' consistently
  const loc = locale === 'se' ? 'sv' : locale; 
  // @ts-ignore
  return dictionaries[loc]?.() ?? dictionaries.en();
};