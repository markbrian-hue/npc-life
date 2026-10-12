
export const COSMETICS = [
  {
    id: 'cone',
    name: 'Traffic Cone Hat',
    description: 'Your head is now road infrastructure.',
    price: 60,
    emoji: '🚧',
  },
  {
    id: 'halo',
    name: 'Suspicious Halo',
    description: 'Looks angelic. Means absolutely nothing.',
    price: 125,
    emoji: '😇',
  },
  {
    id: 'crown',
    name: 'Cardboard Royalty',
    description: 'For people with imaginary kingdoms.',
    price: 200,
    emoji: '👑',
  },
  {
    id: 'bucket',
    name: 'Emergency Bucket',
    description: 'Protection from thoughts and rain.',
    price: 90,
    emoji: '🪣',
  },
  {
    id: 'headphones',
    name: 'Certified Listener',
    description: 'Does not actually play music.',
    price: 150,
    emoji: '🎧',
  },
  {
    id: 'antenna',
    name: 'Wi-Fi Brain',
    description: 'One bar of intelligence.',
    price: 180,
    emoji: '📡',
  },
] as const;

export type CosmeticId =
  (typeof COSMETICS)[number]['id'];

export const SHIRT_COLORS = [
  { id: 'classic', name: 'Default Blue', hex: '#4967ee' },
  { id: 'mint', name: 'Mint Condition', hex: '#4aa88e' },
  { id: 'coral', name: 'Error Coral', hex: '#d8756b' },
  { id: 'lilac', name: 'NPC Purple', hex: '#947acb' },
  { id: 'gold', name: 'Payday Yellow', hex: '#e3b958' },
  { id: 'slate', name: 'Office Grey', hex: '#697c92' },
] as const;

export type ShirtColorId =
  (typeof SHIRT_COLORS)[number]['id'];

export const isCosmetic = (
  id: string
): id is CosmeticId =>
  COSMETICS.some((item) => item.id === id);

export const isShirt = (
  id: string
): id is ShirtColorId =>
  SHIRT_COLORS.some((item) => item.id === id);

export const shirtHex = (id: string) =>
  SHIRT_COLORS.find((color) => color.id === id)?.hex ||
  SHIRT_COLORS[0].hex;

export type ProgressStats = {
  jobs: number;
  discoveries: number;
  owned: number;
  totalDiscoveries: number;
};

export const ACHIEVEMENTS = [
  {
    id: 'first-job',
    title: 'Probably Employed',
    description: 'Finish your first ridiculous job.',
    goal: 1,
    stat: 'jobs',
    emoji: '💼',
  },
  {
    id: 'five-jobs',
    title: 'Part-Time Legend',
    description: 'Complete 5 jobs.',
    goal: 5,
    stat: 'jobs',
    emoji: '🧹',
  },
  {
    id: 'twenty-jobs',
    title: 'Employee of Never',
    description: 'Complete 20 jobs.',
    goal: 20,
    stat: 'jobs',
    emoji: '🏆',
  },
  {
    id: 'three-finds',
    title: 'Professional Snooper',
    description: 'Discover 3 city objects.',
    goal: 3,
    stat: 'discoveries',
    emoji: '🔎',
  },
  {
    id: 'all-finds',
    title: 'City Know-It-All',
    description: 'Find every discoverable object.',
    goal: -1,
    stat: 'discoveries',
    emoji: '🗺️',
  },
  {
    id: 'first-fashion',
    title: 'Bad Fashion Sense',
    description: 'Own a cosmetic.',
    goal: 1,
    stat: 'owned',
    emoji: '🧢',
  },
  {
    id: 'three-fashion',
    title: 'Closet Gremlin',
    description: 'Own 3 cosmetics.',
    goal: 3,
    stat: 'owned',
    emoji: '🧥',
  },
  {
    id: 'six-fashion',
    title: 'Walking Gift Shop',
    description: 'Collect all 6 cosmetics.',
    goal: 6,
    stat: 'owned',
    emoji: '👑',
  },
] as const;

export function achievementProgress(
  achievement: (typeof ACHIEVEMENTS)[number],
  stats: ProgressStats
) {
  const current = stats[achievement.stat];
  const goal =
    achievement.goal === -1
      ? stats.totalDiscoveries
      : achievement.goal;

  return {
    current,
    goal,
    unlocked: current >= goal,
  };
}

export function cityRank(jobs: number): string {
  if (jobs >= 30) return 'CITY MENACE';
  if (jobs >= 15) return 'SEMI-FUNCTIONAL NPC';
  if (jobs >= 5) return 'SLIGHTLY USEFUL';

  return 'CERTIFIED BACKGROUND CHARACTER';
}
