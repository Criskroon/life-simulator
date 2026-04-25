import type { Choice, GameEvent, Outcome } from '../types/events';

export interface ValidationIssue {
  eventId: string;
  choiceIndex: number;
  outcomeIndex?: number;
  message: string;
}

/**
 * Static checks for content shape. Run during tests (and optionally at
 * dev startup) so a malformed event surfaces loudly instead of silently
 * picking the deterministic fallback path at runtime.
 */
export function validateChoice(choice: Choice, eventId: string, choiceIndex: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const hasEffects = Array.isArray(choice.effects);
  const hasOutcomes = Array.isArray(choice.outcomes);

  if (hasEffects && hasOutcomes) {
    issues.push({
      eventId,
      choiceIndex,
      message: 'choice has both `effects` and `outcomes`; pick one',
    });
  }

  if (!hasEffects && !hasOutcomes) {
    issues.push({
      eventId,
      choiceIndex,
      message: 'choice has neither `effects` nor `outcomes`',
    });
  }

  if (hasOutcomes) {
    const outcomes = choice.outcomes as Outcome[];
    if (outcomes.length < 2) {
      issues.push({
        eventId,
        choiceIndex,
        message: `outcomes must have at least 2 entries (got ${outcomes.length}); use \`effects\` for deterministic choices`,
      });
    }

    const totalWeight = outcomes.reduce(
      (sum, o) => sum + (Number.isFinite(o.weight) ? Math.max(0, o.weight) : 0),
      0,
    );
    if (totalWeight <= 0) {
      issues.push({
        eventId,
        choiceIndex,
        message: 'sum of outcome weights must be positive',
      });
    }

    outcomes.forEach((outcome, i) => {
      if (!outcome.narrative || outcome.narrative.trim().length === 0) {
        issues.push({
          eventId,
          choiceIndex,
          outcomeIndex: i,
          message: 'outcome narrative is empty',
        });
      }
      if (!Array.isArray(outcome.effects)) {
        issues.push({
          eventId,
          choiceIndex,
          outcomeIndex: i,
          message: 'outcome.effects must be an array',
        });
      }
    });
  }

  return issues;
}

export function validateEvent(event: GameEvent): ValidationIssue[] {
  return event.choices.flatMap((choice, idx) => validateChoice(choice, event.id, idx));
}

export function validateEvents(events: readonly GameEvent[]): ValidationIssue[] {
  return events.flatMap(validateEvent);
}
