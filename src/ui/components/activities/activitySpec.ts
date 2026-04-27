/**
 * Shared shape for every Section detail screen's activity list.
 * Each {section}Activities.ts file exports a `ReadonlyArray<ActivitySpec>`
 * consumed by `SectionDetailScreen`.
 *
 * `tier`:
 *   - `light` → section-coloured accent square; AP cost shown as filled
 *     coral dots, or a single hollow coral ring when free.
 *   - `big`   → coral accent square; signals a permanent or expensive
 *     commitment. Always carries an AP cost.
 *
 * `money` is base USD. The detail screen passes it through `adjustPrice`
 * with the player's current country so the figure feels local.
 */

export type ActivityTier = 'light' | 'big';

export interface ActivitySpec {
  id: string;
  label: string;
  description: string;
  /** Base USD cost. Omitted for free activities. */
  money?: number;
  /** Action-point cost. 0 = free; light tier rows show a hollow ring. */
  apCost: number;
  tier: ActivityTier;
}
