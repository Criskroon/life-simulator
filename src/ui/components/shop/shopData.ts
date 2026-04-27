/**
 * Shop sub-flow content. Two-level catalog:
 *
 *  1. `STORES` — the 9 storefronts shown on the Shop Hub. Only `auto-dealer`
 *     resolves to a Level-3 detail screen this session; the rest fall back
 *     to a Coming-soon toast on tap. Each store carries its own accent
 *     token so the hub grid pops with a different colour per row.
 *  2. `AUTO_DEALER_INVENTORY` — 12 cars curated for the 1996 NL market.
 *     `featured: true` lifts a row into the "Featured today" strip; the
 *     rest land in "In stock". Filter logic on the detail screen reads
 *     `price`, `condition`, and `category` directly off these rows.
 */
export type StoreId =
  | 'auto-dealer'
  | 'real-estate'
  | 'jewelry'
  | 'watches'
  | 'art-auction'
  | 'boats'
  | 'electronics'
  | 'fashion'
  | 'pets';

export type StoreIconKey =
  | 'car'
  | 'house'
  | 'gem'
  | 'watch'
  | 'frame'
  | 'boat'
  | 'tv'
  | 'shirt'
  | 'paw';

export interface ShopStore {
  id: StoreId;
  name: string;
  /** Tailwind background class for the icon block. */
  accentClass: string;
  /** "Lange Vijverberg · Den Haag" — neighbourhood + city. */
  locale: string;
  /** Italic status sub-line shown under the locale on the hub card. */
  status: string;
  iconKey: StoreIconKey;
  /** Only `true` for stores with a wired Level-3 screen this session. */
  functional: boolean;
  /** Toast detail when tapping a non-functional store on the Hub. */
  comingSoonDetail: string;
}

export const STORES: ReadonlyArray<ShopStore> = [
  {
    id: 'auto-dealer',
    name: 'Auto Dealer',
    accentClass: 'bg-coral',
    locale: 'Lange Vijverberg · Den Haag',
    status: '12 in stock this season',
    iconKey: 'car',
    functional: true,
    comingSoonDetail: '',
  },
  {
    id: 'real-estate',
    name: 'Real Estate Office',
    accentClass: 'bg-section-mind',
    locale: 'Herengracht · Amsterdam',
    status: '8 properties available',
    iconKey: 'house',
    functional: false,
    comingSoonDetail: 'Property browser arrives later this year.',
  },
  {
    id: 'jewelry',
    name: 'Jewelry Store',
    accentClass: 'bg-section-heart',
    locale: 'P.C. Hooftstraat · Amsterdam',
    status: 'New collection this season',
    iconKey: 'gem',
    functional: false,
    comingSoonDetail: 'Necklaces, rings, the works — opens later.',
  },
  {
    id: 'watches',
    name: 'Watch Boutique',
    accentClass: 'bg-section-town',
    locale: 'Magna Plaza',
    status: 'Luxury timepieces',
    iconKey: 'watch',
    functional: false,
    comingSoonDetail: 'Mechanical movements arrive in a future session.',
  },
  {
    id: 'art-auction',
    name: 'Art Auction House',
    accentClass: 'bg-section-mirror',
    locale: "Spui · Christie's",
    status: 'Spring auction running',
    iconKey: 'frame',
    functional: false,
    comingSoonDetail: 'Auction floor opens once bidding is wired.',
  },
  {
    id: 'boats',
    name: 'Boat Dealer',
    accentClass: 'bg-section-mind',
    locale: 'IJmuiden harbor',
    status: 'Yachts and sailboats',
    iconKey: 'boat',
    functional: false,
    comingSoonDetail: 'Hulls and sails come with the marina pass.',
  },
  {
    id: 'electronics',
    name: 'Electronics Megastore',
    accentClass: 'bg-section-body',
    locale: 'BCC · Damrak',
    status: 'Tech and gadgets',
    iconKey: 'tv',
    functional: false,
    comingSoonDetail: 'Tech shelves stock up next session.',
  },
  {
    id: 'fashion',
    name: 'Fashion Boutique',
    accentClass: 'bg-section-wallet',
    locale: 'Negen Straatjes',
    status: 'Designer clothing',
    iconKey: 'shirt',
    functional: false,
    comingSoonDetail: 'The fitting rooms aren’t open yet.',
  },
  {
    id: 'pets',
    name: 'Pet Shop',
    accentClass: 'bg-section-shadows',
    locale: 'Reguliersgracht',
    status: 'Companions of all sizes',
    iconKey: 'paw',
    functional: false,
    comingSoonDetail: 'Pets already live in People — the shop joins later.',
  },
];

export type CarCondition = 'new' | 'used' | 'restored';
export type CarCategory = 'family' | 'sport' | 'luxury' | 'economy';
export type CarBadge = 'live-deal' | 'dream' | 'new';

export interface AutoListing {
  id: string;
  /** "Volkswagen Polo" — make + model joined into one display line. */
  make: string;
  /** Two-digit model year tag, e.g. "'96". */
  yearTag: string;
  condition: CarCondition;
  /** Mileage in km. Omitted (`null`) for new cars. */
  mileageKm: number | null;
  /** Sticker price in EUR (Auto Dealer is NL-only this session). */
  price: number;
  category: CarCategory;
  /** Optional badge ribbon shown on the product card. */
  badge: CarBadge | null;
  /** Lifts the row into the Featured strip. */
  featured: boolean;
}

export const AUTO_DEALER_INVENTORY: ReadonlyArray<AutoListing> = [
  // Featured (3) — top of the store, hero row.
  {
    id: 'vw-polo-96',
    make: 'Volkswagen Polo',
    yearTag: "'96",
    condition: 'new',
    mileageKm: null,
    price: 14500,
    category: 'family',
    badge: 'live-deal',
    featured: true,
  },
  {
    id: 'saab-900-89',
    make: 'Saab 900',
    yearTag: "'89",
    condition: 'used',
    mileageKm: 110000,
    price: 6800,
    category: 'economy',
    badge: null,
    featured: true,
  },
  {
    id: 'volvo-850-95',
    make: 'Volvo 850 Estate',
    yearTag: "'95",
    condition: 'used',
    mileageKm: 40000,
    price: 11500,
    category: 'family',
    badge: null,
    featured: true,
  },
  // In stock (9) — main grid below the fold.
  {
    id: 'peugeot-306-94',
    make: 'Peugeot 306',
    yearTag: "'94",
    condition: 'used',
    mileageKm: 60000,
    price: 9200,
    category: 'family',
    badge: null,
    featured: false,
  },
  {
    id: 'bmw-318i-92',
    make: 'BMW 318i',
    yearTag: "'92",
    condition: 'used',
    mileageKm: 80000,
    price: 11000,
    category: 'sport',
    badge: null,
    featured: false,
  },
  {
    id: 'mercedes-190e-88',
    make: 'Mercedes 190E',
    yearTag: "'88",
    condition: 'used',
    mileageKm: 140000,
    price: 5400,
    category: 'luxury',
    badge: null,
    featured: false,
  },
  {
    id: 'porsche-911-85',
    make: 'Porsche 911 Carrera',
    yearTag: "'85",
    condition: 'restored',
    mileageKm: 95000,
    price: 28000,
    category: 'sport',
    badge: 'dream',
    featured: false,
  },
  {
    id: 'fiat-panda-93',
    make: 'Fiat Panda',
    yearTag: "'93",
    condition: 'used',
    mileageKm: 90000,
    price: 3200,
    category: 'economy',
    badge: null,
    featured: false,
  },
  {
    id: 'audi-80-94',
    make: 'Audi 80',
    yearTag: "'94",
    condition: 'used',
    mileageKm: 70000,
    price: 7500,
    category: 'family',
    badge: null,
    featured: false,
  },
  {
    id: 'renault-twingo-95',
    make: 'Renault Twingo',
    yearTag: "'95",
    condition: 'new',
    mileageKm: null,
    price: 11800,
    category: 'economy',
    badge: 'new',
    featured: false,
  },
  {
    id: 'opel-astra-93',
    make: 'Opel Astra',
    yearTag: "'93",
    condition: 'used',
    mileageKm: 95000,
    price: 5800,
    category: 'family',
    badge: null,
    featured: false,
  },
  {
    id: 'alfa-33-90',
    make: 'Alfa Romeo 33',
    yearTag: "'90",
    condition: 'used',
    mileageKm: 120000,
    price: 3900,
    category: 'sport',
    badge: null,
    featured: false,
  },
];

export type AutoFilterId = 'all' | 'under-10k' | 'new' | 'family' | 'sport';

export interface AutoFilter {
  id: AutoFilterId;
  label: string;
  match: (listing: AutoListing) => boolean;
}

export const AUTO_FILTERS: ReadonlyArray<AutoFilter> = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'under-10k', label: 'Under €10k', match: (l) => l.price < 10000 },
  { id: 'new', label: 'New', match: (l) => l.condition === 'new' },
  { id: 'family', label: 'Family', match: (l) => l.category === 'family' },
  { id: 'sport', label: 'Sport', match: (l) => l.category === 'sport' },
];

/**
 * Sunny Side voice copy for the buy action's Coming-soon toast. Lifted
 * to a constant so every product card surfaces the same line — the
 * Auto Dealer "remembers your interest" until the buy-flow lands.
 */
export const AUTO_BUY_TOAST_DETAIL =
  'Asset purchase arrives later. The Auto Dealer will remember your interest.';
