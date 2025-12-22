import 'server-only';
import { cookies } from 'next/headers';

const dictionaries = {
	en: () => import('./en.json').then((module) => module.default),
	zh: () => import('./zh.json').then((module) => module.default)
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale?: Locale) => {
	if (locale) {
		return dictionaries[locale]();
	}

	const cookieStore = await cookies();
	const lang = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'en';
	return dictionaries[lang] ? dictionaries[lang]() : dictionaries.en();
};

export const getCurrentLocale = async (): Promise<Locale> => {
	const cookieStore = await cookies();
	const lang = cookieStore.get('NEXT_LOCALE')?.value as Locale;
	return lang && dictionaries[lang] ? lang : 'en';
};
