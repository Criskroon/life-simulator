/**
 * The Wallet — money in, money out, money sideways. Light tier covers
 * the small habits a person can pick up; big tier carries the moves
 * that meaningfully shift a balance sheet (or sink one).
 */

import type { ActivitySpec } from './activitySpec';

export const WALLET_ACTIVITIES: ReadonlyArray<ActivitySpec> = [
  {
    id: 'check-the-budget',
    label: 'Check the budget',
    description: 'A quiet hour with a spreadsheet.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'sell-something-old',
    label: 'Sell something old',
    description: 'Closet, cupboard, garage. All of it.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'cancel-a-subscription',
    label: 'Cancel a subscription',
    description: 'Three minutes. Saves you a year.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'ask-for-a-raise',
    label: 'Ask for a raise',
    description: 'Walk in prepared. Walk out anyway.',
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'buy-a-stock',
    label: 'Buy a stock',
    description: 'Put a small bet on a future you like.',
    money: 500,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'try-day-trading',
    label: 'Try day trading',
    description: 'Screens, charts, regret by lunchtime.',
    money: 1000,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'buy-a-lottery-ticket',
    label: 'Buy a lottery ticket',
    description: 'A few dollars on a tiny door.',
    money: 5,
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'gamble-at-a-casino',
    label: 'Gamble at a casino',
    description: 'Bring what you can lose. Leave when it’s gone.',
    money: 300,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'start-a-side-hustle',
    label: 'Start a side hustle',
    description: 'A second job pretending to be a hobby.',
    money: 600,
    apCost: 2,
    tier: 'big',
  },
  {
    id: 'invest-in-crypto',
    label: 'Invest in crypto',
    description: 'A coin you read about once. Maybe twice.',
    money: 2000,
    apCost: 2,
    tier: 'big',
  },
  {
    id: 'back-a-friends-business',
    label: "Back a friend's business",
    description: 'You believe in them. Mostly.',
    money: 5000,
    apCost: 2,
    tier: 'big',
  },
];
