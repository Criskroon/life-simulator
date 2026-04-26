import type { RelationshipType } from '../types/gameState';
import type { RelationshipAction } from '../types/interactions';

/**
 * X2 ships two partner actions end-to-end to prove the light/big patterns
 * work. The other relationship types get empty arrays so the modal opens
 * with a "more actions coming soon" placeholder — X3 fills them out.
 *
 * Authoring conventions (mirrors events/activities):
 *   - amounts in baseline (GB) units; the country engine adjusts on apply
 *   - probabilistic outcomes use the Outcome shape; ≥2 entries
 *   - narratives stay BitLife-dry and gender-neutral ("they" not "she")
 *     because the partner could be male, female, or nonbinary
 *   - `target.*` paths in conditions resolve against the targeted Person
 *
 * To add an action: append to the right type's array. The engine module
 * (`interactions.ts`) picks them up automatically.
 */
export const ACTIONS_BY_TYPE: Record<RelationshipType, RelationshipAction[]> = {
  partner: [
    {
      id: 'partner.spend_time',
      label: 'Spend time together',
      description: 'An afternoon, no agenda.',
      tier: 'light',
      applicableTo: ['partner'],
      effects: [
        { path: 'stats.happiness', op: '+', value: 5 },
        { special: 'adjustRelationshipLevel', payload: { delta: 5 } },
      ],
    },
    {
      id: 'partner.propose',
      label: 'Propose marriage',
      description: 'Ring, knee, the works.',
      tier: 'big',
      applicableTo: ['partner'],
      cost: -4500,
      conditions: [
        { path: 'target.relationshipLevel', op: '>=', value: 60 },
      ],
      outcomes: [
        {
          weight: 70,
          narrative:
            'They said yes. Tears, surprise, the works. The ring fits.',
          effects: [
            { path: 'money', op: '-', value: 4500 },
            { path: 'stats.happiness', op: '+', value: 12 },
            { special: 'addFiance', payload: { promoteSlot: 'partner' } },
          ],
        },
        {
          weight: 20,
          narrative:
            "They hesitated, then nodded slowly. \"Okay,\" they said. \"Let's figure this out together.\"",
          effects: [
            { path: 'money', op: '-', value: 4500 },
            { path: 'stats.happiness', op: '+', value: 5 },
            { special: 'addFiance', payload: { promoteSlot: 'partner' } },
          ],
        },
        {
          weight: 10,
          narrative:
            'They said no. The ring sits between you on the table. Neither of you knows where to look.',
          effects: [
            { path: 'money', op: '-', value: 4500 },
            { path: 'stats.happiness', op: '-', value: 15 },
            { special: 'breakUpPartner' },
          ],
        },
      ],
    },
    {
      id: 'partner.gift',
      label: 'Buy them a gift',
      description: 'A small thing. They notice the small things.',
      tier: 'light',
      applicableTo: ['partner'],
      cost: -200,
      effects: [
        { path: 'money', op: '-', value: 200 },
        { path: 'stats.happiness', op: '+', value: 5 },
        { special: 'adjustRelationshipLevel', payload: { delta: 8 } },
      ],
    },
    {
      id: 'partner.compliment',
      label: 'Compliment them',
      description: 'A passing line. Costs nothing.',
      tier: 'light',
      applicableTo: ['partner'],
      effects: [
        { path: 'stats.happiness', op: '+', value: 2 },
        { special: 'adjustRelationshipLevel', payload: { delta: 4 } },
      ],
    },
    {
      id: 'partner.deep_conversation',
      label: 'Have a deep conversation',
      description: 'The kind that doesn’t happen on a Tuesday.',
      tier: 'light',
      applicableTo: ['partner'],
      conditions: [
        { path: 'target.relationshipLevel', op: '>=', value: 40 },
      ],
      effects: [
        { path: 'stats.happiness', op: '+', value: 3 },
        { path: 'stats.smarts', op: '+', value: 1 },
        { special: 'adjustRelationshipLevel', payload: { delta: 6 } },
      ],
    },
    {
      id: 'partner.suggest_vacation',
      label: 'Suggest a vacation',
      description: 'Two weeks, somewhere warmer.',
      tier: 'big',
      applicableTo: ['partner'],
      cost: -2500,
      conditions: [
        { path: 'target.yearsTogether', op: '>=', value: 1 },
      ],
      outcomes: [
        {
          weight: 70,
          narrative: 'You came back closer than when you left.',
          effects: [
            { path: 'money', op: '-', value: 2500 },
            { path: 'stats.happiness', op: '+', value: 16 },
            { special: 'adjustRelationshipLevel', payload: { delta: 12 } },
          ],
        },
        {
          weight: 25,
          narrative: 'It was fine. The hotel was overpriced.',
          effects: [
            { path: 'money', op: '-', value: 2500 },
            { path: 'stats.happiness', op: '+', value: 6 },
            { special: 'adjustRelationshipLevel', payload: { delta: 4 } },
          ],
        },
        {
          weight: 5,
          narrative:
            'Something snapped on day three. The flight home was silent.',
          effects: [
            { path: 'money', op: '-', value: 2500 },
            { path: 'stats.happiness', op: '-', value: 12 },
            { special: 'adjustRelationshipLevel', payload: { delta: -8 } },
          ],
        },
      ],
    },
    {
      id: 'partner.argue',
      label: 'Pick a fight',
      description: 'You fought. Words were said.',
      tier: 'light',
      applicableTo: ['partner'],
      effects: [
        { path: 'stats.happiness', op: '-', value: 10 },
        { special: 'adjustRelationshipLevel', payload: { delta: -8 } },
      ],
    },
  ],
  fiance: [],
  spouse: [],
  father: [],
  mother: [],
  sibling: [],
  child: [],
  friend: [],
  significantEx: [],
  casualEx: [],
};
