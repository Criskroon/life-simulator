/**
 * The eight Worlds — canonical list shared by ActivitiesMenuV2 and any
 * future per-World detail screens. Section tokens map to tailwind
 * `section.*` colours defined in tailwind.config.js.
 */

export type WorldKey =
  | 'body'
  | 'mind'
  | 'town'
  | 'heart'
  | 'wallet'
  | 'shop'
  | 'shadows'
  | 'mirror';

export type WorldIconKey =
  | 'gym'
  | 'book'
  | 'cup'
  | 'heart'
  | 'coin'
  | 'bag'
  | 'mask'
  | 'sparkles';

export interface World {
  key: WorldKey;
  name: string;
  tagline: string;
  /** Tailwind background utility for the icon block (e.g. `bg-section-body`). */
  bgClass: string;
  iconKey: WorldIconKey;
  /** Sub-line shown by the Coming-soon toast — Sunny Side voice. */
  toastDetail: string;
}

export const WORLDS: ReadonlyArray<World> = [
  {
    key: 'body',
    name: 'The Body',
    tagline: 'Care, repair, alter your physical self.',
    bgClass: 'bg-section-body',
    iconKey: 'gym',
    toastDetail: 'Body activities arrive next session.',
  },
  {
    key: 'mind',
    name: 'The Mind',
    tagline: 'Heal, sharpen, expand your inner life.',
    bgClass: 'bg-section-mind',
    iconKey: 'book',
    toastDetail: 'Mind activities are still being written.',
  },
  {
    key: 'town',
    name: 'The Town',
    tagline: 'Go out, do things, see people.',
    bgClass: 'bg-section-town',
    iconKey: 'cup',
    toastDetail: 'The Town opens once nightlife is wired.',
  },
  {
    key: 'heart',
    name: 'The Heart',
    tagline: 'Find love, lose it, look for connection.',
    bgClass: 'bg-section-heart',
    iconKey: 'heart',
    toastDetail: 'Already lives partly in People — fuller soon.',
  },
  {
    key: 'wallet',
    name: 'The Wallet',
    tagline: 'Make money, lose money, gamble it all.',
    bgClass: 'bg-section-wallet',
    iconKey: 'coin',
    toastDetail: 'Money moves arrive with the economy pass.',
  },
  {
    key: 'shop',
    name: 'The Shop',
    tagline: 'Buy things — big and small.',
    bgClass: 'bg-section-shop',
    iconKey: 'bag',
    toastDetail: 'The Shop opens once Assets is wired.',
  },
  {
    key: 'shadows',
    name: 'The Shadows',
    tagline: 'Off the books.',
    bgClass: 'bg-section-shadows',
    iconKey: 'mask',
    toastDetail: 'Crime and consequence land later.',
  },
  {
    key: 'mirror',
    name: 'The Mirror',
    tagline: 'Reinvent who you are.',
    bgClass: 'bg-section-mirror',
    iconKey: 'sparkles',
    toastDetail: 'Identity changes arrive after the core loops.',
  },
];
