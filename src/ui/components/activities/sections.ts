/**
 * The eight Sections — canonical list shared by ActivitiesMenuV2 and any
 * future per-Section detail screens. Section tokens map to tailwind
 * `section.*` colours defined in tailwind.config.js.
 */

export type SectionKey =
  | 'body'
  | 'mind'
  | 'town'
  | 'heart'
  | 'wallet'
  | 'shop'
  | 'shadows'
  | 'mirror';

export type SectionIconKey =
  | 'gym'
  | 'book'
  | 'cup'
  | 'heart'
  | 'coin'
  | 'bag'
  | 'mask'
  | 'sparkles';

export interface Section {
  key: SectionKey;
  name: string;
  /** Short subhead used on the Activities Menu cards (full sentence). */
  tagline: string;
  /** Tailwind background utility for the icon block (e.g. `bg-section-body`). */
  bgClass: string;
  /** Matching text-colour utility for the eyebrow on the detail screen. */
  textClass: string;
  iconKey: SectionIconKey;
  /** Sub-line shown by the Coming-soon toast — Sunny Side voice. */
  toastDetail: string;
  /**
   * Three-beat headline shown at the top of the Section detail screen.
   * Cadence: three verbs or a short declaration. Always ends with a period.
   */
  detailHeadline: string;
  /** Italic one-liner under the headline on the detail screen. */
  detailTagline: string;
}

export const SECTIONS: ReadonlyArray<Section> = [
  {
    key: 'body',
    name: 'The Body',
    tagline: 'Care, repair, alter your physical self.',
    bgClass: 'bg-section-body',
    textClass: 'text-section-body',
    iconKey: 'gym',
    toastDetail: 'Body activities arrive next session.',
    detailHeadline: 'Care, repair, alter.',
    detailTagline: 'What you do with the only one you get.',
  },
  {
    key: 'mind',
    name: 'The Mind',
    tagline: 'Heal, sharpen, expand your inner life.',
    bgClass: 'bg-section-mind',
    textClass: 'text-section-mind',
    iconKey: 'book',
    toastDetail: 'Mind activities are still being written.',
    detailHeadline: 'Read, think, learn.',
    detailTagline: 'The room nobody else gets to enter.',
  },
  {
    key: 'town',
    name: 'The Town',
    tagline: 'Go out, do things, see people.',
    bgClass: 'bg-section-town',
    textClass: 'text-section-town',
    iconKey: 'cup',
    toastDetail: 'The Town opens once nightlife is wired.',
    detailHeadline: 'Show up, take part, be seen.',
    detailTagline: 'You live somewhere. Act like it.',
  },
  {
    key: 'heart',
    name: 'The Heart',
    tagline: 'Find love, lose it, look for connection.',
    bgClass: 'bg-section-heart',
    textClass: 'text-section-heart',
    iconKey: 'heart',
    toastDetail: 'Already lives partly in People — fuller soon.',
    detailHeadline: 'Meet, fall, fall apart.',
    detailTagline: 'The math is never quite even.',
  },
  {
    key: 'wallet',
    name: 'The Wallet',
    tagline: 'Make money, lose money, gamble it all.',
    bgClass: 'bg-section-wallet',
    textClass: 'text-section-wallet',
    iconKey: 'coin',
    toastDetail: 'Money moves arrive with the economy pass.',
    detailHeadline: 'Earn, risk, lose.',
    detailTagline: 'Money does what you tell it. Mostly.',
  },
  {
    key: 'shop',
    name: 'The Shop',
    tagline: 'Buy things — big and small.',
    bgClass: 'bg-section-shop',
    textClass: 'text-section-shop',
    iconKey: 'bag',
    toastDetail: 'The Shop opens once Assets is wired.',
    detailHeadline: 'Browse, choose, take it home.',
    detailTagline: 'Every receipt is a small autobiography.',
  },
  {
    key: 'shadows',
    name: 'The Shadows',
    tagline: 'Off the books.',
    bgClass: 'bg-section-shadows',
    textClass: 'text-section-shadows',
    iconKey: 'mask',
    toastDetail: 'Crime and consequence land later.',
    detailHeadline: 'Cut corners. Try not to get caught.',
    detailTagline: 'Off the books, on your conscience.',
  },
  {
    key: 'mirror',
    name: 'The Mirror',
    tagline: 'Reinvent who you are.',
    bgClass: 'bg-section-mirror',
    textClass: 'text-section-mirror',
    iconKey: 'sparkles',
    toastDetail: 'Identity changes arrive after the core loops.',
    detailHeadline: 'Cut, dye, become someone else.',
    detailTagline: 'How you’d like to be seen.',
  },
];
