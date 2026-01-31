export type XPSource =
	| 'core_action'
	| 'maintenance_action'
	| 'daily_streak'
	| 'bonus';

export const XP_VALUES: Record<XPSource, number> = {
	core_action: 50,
	maintenance_action: 10,
	daily_streak: 100,
	bonus: 20
};

const LEVEL_THRESHOLDS = Array.from({ length: 100 }, (_, i) =>
	Math.floor(100 * Math.pow(1.2, i))
);

export const LEVEL_TITLES = [
	{ min: 1, max: 9, key: 'novice' },
	{ min: 10, max: 19, key: 'apprentice' },
	{ min: 20, max: 29, key: 'adept' },
	{ min: 30, max: 49, key: 'expert' },
	{ min: 50, max: 99, key: 'master' },
	{ min: 100, max: 999, key: 'legend' }
];

export function getLevelTitleKey(level: number) {
	const title = LEVEL_TITLES.find((t) => level >= t.min && level <= t.max);
	return title ? title.key : 'novice';
}

export async function getLevelFromXP(xp: number) {
	let level = 1;
	for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
		if (xp >= LEVEL_THRESHOLDS[i]) {
			level = i + 2; // Level 1 is base (0 XP)
		} else {
			break;
		}
	}
	return level;
}

export async function getNextLevelXP(level: number) {
	// Level 1 needs LEVEL_THRESHOLDS[0] to reach Level 2
	return LEVEL_THRESHOLDS[level - 1] || 999999;
}
