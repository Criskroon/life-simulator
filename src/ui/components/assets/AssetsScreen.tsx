import { getCurrentCountry } from '../../../game/engine/countryEngine';
import type { PlayerState } from '../../../game/types/gameState';
import { useComingSoon } from '../ComingSoonHandler';
import { AssetRow } from './AssetRow';
import { AssetSectionHeader } from './AssetSectionHeader';
import {
  BANK_BY_COUNTRY,
  MOCK_INVESTMENTS,
  MOCK_PROPERTIES,
  MOCK_VEHICLES,
  NEIGHBOURHOOD_BY_COUNTRY,
  PILL_TOASTS,
  synthesiseNetWorthHistory,
  type PropertyEntry,
  type VehicleEntry,
} from './assetsData';
import { NetWorthCard } from './NetWorthCard';

interface AssetsScreenProps {
  player: PlayerState;
}

/**
 * Assets tab — a status overview of the player's net worth and what
 * sits beneath it. Reads top-down: header strip with life-stage / year /
 * live total, a Net Worth hero card with mock 9-year history, then
 * Liquid / Property / Vehicles / Investments sections. Sections are
 * never collapsible (different from Career) and the screen has no
 * overall Shop CTA — the per-section "+" pills carry the entrance
 * points instead.
 *
 * Liquid is wired to real `player.money`; everything else reads from
 * mock arrays in `assetsData.ts` until the asset engine lands. All
 * "+" pills route through `useComingSoon` with section-specific copy.
 */
export function AssetsScreen({ player }: AssetsScreenProps) {
  const { showComingSoon } = useComingSoon();
  const country = getCurrentCountry(player);
  const symbol = country.currency.symbol;

  const liquidTotal = player.money;
  const propertyTotal = sumValues(MOCK_PROPERTIES);
  const vehicleTotal = sumValues(MOCK_VEHICLES);
  const investmentTotal = sumValues(MOCK_INVESTMENTS);
  const netWorthTotal =
    liquidTotal + propertyTotal + vehicleTotal + investmentTotal;

  const { deltaAmount, qualitative } = mockNetWorthDelta(player, netWorthTotal);
  const history = synthesiseNetWorthHistory(netWorthTotal);

  const bank = BANK_BY_COUNTRY[player.country] ?? {
    account: 'Checking',
    bank: 'Local bank',
  };
  const neighbourhood = NEIGHBOURHOOD_BY_COUNTRY[player.country];
  const lifeStage = lifeStageFor(player.age);
  const subtitle = `Net worth · ${formatMoney(symbol, netWorthTotal)}`;

  return (
    <div data-testid="assets-screen" className="space-y-3 pb-2">
      {/* Header — eyebrow (life stage · year), display "Assets", live total subtitle. */}
      <div className="rounded-2xl border border-cream-dark bg-cream-light px-4 py-3 shadow-warm">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brass">
          {lifeStage} · {player.currentYear}
        </div>
        <h2 className="mt-1 font-display text-[24px] font-bold leading-[1.05] tracking-[-0.025em] text-ink">
          Assets
        </h2>
        <p
          data-testid="assets-header-subtitle"
          className="mt-1 font-sans text-[12.5px] leading-snug text-ink-soft"
        >
          {subtitle}
        </p>
      </div>

      <NetWorthCard
        totalLabel={formatMoney(symbol, netWorthTotal)}
        deltaLabel={`+${formatMoney(symbol, deltaAmount)}`}
        qualitative={qualitative}
        history={history}
        endYear={player.currentYear}
      />

      {/* LIQUID — single bank row, no "+" pill. */}
      <section className="space-y-2">
        <AssetSectionHeader title="Liquid" testId="assets-section-liquid" />
        <AssetRow
          testId="assets-row-liquid"
          icon={<BankGlyph />}
          accentClass="bg-section-mind"
          title={`${bank.account} · ${bank.bank}`}
          status="Accessible today"
          amountLabel={formatMoney(symbol, liquidTotal)}
        />
      </section>

      {/* PROPERTY — mock home(s) + Real Estate pill. */}
      <section className="space-y-2">
        <AssetSectionHeader
          title="Property"
          countLabel={
            MOCK_PROPERTIES.length === 1 ? '1 home' : `${MOCK_PROPERTIES.length} homes`
          }
          pill={{
            label: 'Real Estate',
            onClick: () =>
              showComingSoon(PILL_TOASTS.property.label, PILL_TOASTS.property.detail),
            testId: 'assets-pill-property',
          }}
          testId="assets-section-property"
        />
        {MOCK_PROPERTIES.map((p) => (
          <AssetRow
            key={p.id}
            testId={`assets-row-property-${p.id}`}
            icon={<HouseGlyph />}
            accentClass="bg-coral"
            title={`${p.kind} · ${neighbourhood ?? p.locale}`}
            subtitle={propertySubtitle(symbol, p)}
            amountLabel={formatMoney(symbol, p.currentValue)}
            progress={{
              value: p.mortgageOriginal - p.mortgageRemaining,
              total: p.mortgageOriginal,
              progressColorClass: 'bg-success',
              label: mortgageProgressLabel(p),
            }}
          />
        ))}
      </section>

      {/* VEHICLES — mock car(s) + Auto Dealer pill. */}
      <section className="space-y-2">
        <AssetSectionHeader
          title="Vehicles"
          countLabel={
            MOCK_VEHICLES.length === 1 ? '1 car' : `${MOCK_VEHICLES.length} cars`
          }
          pill={{
            label: 'Auto Dealer',
            onClick: () =>
              showComingSoon(PILL_TOASTS.vehicles.label, PILL_TOASTS.vehicles.detail),
            testId: 'assets-pill-vehicles',
          }}
          testId="assets-section-vehicles"
        />
        {MOCK_VEHICLES.map((v) => (
          <AssetRow
            key={v.id}
            testId={`assets-row-vehicle-${v.id}`}
            icon={<CarGlyph />}
            accentClass="bg-section-town"
            title={`${v.make} · ${v.yearTag}`}
            subtitle={vehicleSubtitle(v)}
            amountLabel={formatMoney(symbol, v.currentValue)}
            progress={{
              value: v.condition,
              total: 100,
              progressColorClass: conditionColorClass(v.condition),
              label: `${conditionLabel(v.condition)} · ${v.condition}/100`,
            }}
          />
        ))}
      </section>

      {/* INVESTMENTS — mix of financial + sentimental + Belongings pill. */}
      <section className="space-y-2">
        <AssetSectionHeader
          title="Investments"
          countLabel={
            MOCK_INVESTMENTS.length === 1
              ? '1 holding'
              : `${MOCK_INVESTMENTS.length} holdings`
          }
          pill={{
            label: 'Belongings',
            onClick: () =>
              showComingSoon(
                PILL_TOASTS.investments.label,
                PILL_TOASTS.investments.detail,
              ),
            testId: 'assets-pill-investments',
          }}
          testId="assets-section-investments"
        />
        {MOCK_INVESTMENTS.map((inv) => (
          <AssetRow
            key={inv.id}
            testId={`assets-row-investment-${inv.id}`}
            icon={inv.kind === 'financial' ? <ChartGlyph /> : <GemGlyph />}
            accentClass={
              inv.kind === 'financial' ? 'bg-section-mind' : 'bg-section-heart'
            }
            title={`${inv.title} · ${inv.detail}`}
            subtitle={inv.provenance}
            amountLabel={formatMoney(symbol, inv.currentValue)}
          />
        ))}
      </section>
    </div>
  );
}

function sumValues<T extends { currentValue: number }>(
  rows: ReadonlyArray<T>,
): number {
  return rows.reduce((acc, row) => acc + row.currentValue, 0);
}

/**
 * Format an integer money amount with a country symbol. Negative
 * amounts get a leading minus before the symbol so the column reads
 * cleanly when delta lines mix signs.
 */
function formatMoney(symbol: string, amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(amount).toLocaleString()}`;
}

/**
 * Synthesise a year-over-year net worth delta. The engine has no past
 * net worth, so we fall back to a fixed 12% growth band — chosen so
 * the qualitative copy lands on "ahead of pace" rather than the
 * neutral-sounding "steady" by default. Players whose current total
 * is zero (fresh life, broke) get the "first year" copy instead.
 */
function mockNetWorthDelta(
  player: PlayerState,
  total: number,
): {
  deltaAmount: number;
  qualitative: 'ahead of pace' | 'steady' | 'falling behind' | 'first year';
} {
  if (total <= 0) {
    return { deltaAmount: 0, qualitative: 'first year' };
  }
  // Player's first 5 years at the table — even with mock collateral on
  // the books, the chart story is "you only just got here".
  if (player.age < 18) {
    return { deltaAmount: Math.round(total * 0.06), qualitative: 'steady' };
  }
  return { deltaAmount: Math.round(total * 0.12), qualitative: 'ahead of pace' };
}

function propertySubtitle(symbol: string, p: PropertyEntry): string {
  const tenure =
    p.yearsOwned === 0
      ? 'Just bought'
      : `Owned ${p.yearsOwned}y`;
  if (p.mortgageRemaining <= 0) {
    return `${tenure} · Paid off`;
  }
  const k = Math.round(p.mortgageRemaining / 1000);
  return `${tenure} · ${symbol}${k}k mortgage left`;
}

function mortgageProgressLabel(p: PropertyEntry): string {
  if (p.mortgageRemaining <= 0) return 'Paid off';
  const paid = p.mortgageOriginal - p.mortgageRemaining;
  const pct = Math.round((paid / p.mortgageOriginal) * 100);
  return `${pct}% paid`;
}

function vehicleSubtitle(v: VehicleEntry): string {
  const km = (v.mileageKm / 1000).toFixed(0);
  return `${conditionLabel(v.condition)} · ${km}k km`;
}

function conditionLabel(condition: number): string {
  if (condition >= 80) return 'Pristine';
  if (condition >= 60) return 'Decent shape';
  if (condition >= 40) return 'Tired';
  if (condition >= 20) return 'Rough';
  return 'On its last legs';
}

function conditionColorClass(condition: number): string {
  if (condition >= 60) return 'bg-success';
  if (condition >= 30) return 'bg-warning';
  return 'bg-danger';
}

/**
 * Bucket the player's age into a life-stage label for the header
 * eyebrow. Mirrors the same brackets used by Career — duplicated
 * intentionally so neither screen depends on the other for a label.
 */
function lifeStageFor(age: number): string {
  if (age < 13) return 'CHILDHOOD';
  if (age < 18) return 'YOUTH';
  if (age < 30) return 'YOUNG ADULTHOOD';
  if (age < 60) return 'ADULTHOOD';
  return 'LATER YEARS';
}

function BankGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10 L12 4 L21 10" />
      <path d="M5 10 V19" />
      <path d="M19 10 V19" />
      <path d="M9 10 V19" />
      <path d="M15 10 V19" />
      <path d="M3 20 H21" />
    </svg>
  );
}

function HouseGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11 L12 4 L21 11" />
      <path d="M5 10 V20 H19 V10" />
      <path d="M10 20 V14 H14 V20" />
    </svg>
  );
}

function CarGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 14 L5.5 9 H18.5 L20 14" />
      <path d="M3 14 H21 V18 H3 Z" />
      <circle cx={7} cy={18} r={1.4} />
      <circle cx={17} cy={18} r={1.4} />
    </svg>
  );
}

function ChartGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19 H20" />
      <path d="M6 19 V13" />
      <path d="M11 19 V8" />
      <path d="M16 19 V11" />
    </svg>
  );
}

function GemGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4 H18 L21 9 L12 21 L3 9 Z" />
      <path d="M3 9 H21" />
      <path d="M9 4 L12 21" />
      <path d="M15 4 L12 21" />
    </svg>
  );
}
