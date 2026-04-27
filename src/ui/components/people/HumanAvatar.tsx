interface HumanAvatarProps {
  firstName: string;
  lastName: string;
  /**
   * Pixel size of the avatar disc. Profile hero uses 72 (matches
   * PetProfileModal's hero exactly for side-by-side consistency); row
   * uses 40.
   */
  size?: number;
  /**
   * When true, wraps the disc in the same brass→coral gradient ring used
   * by `PetProfileModal`'s hero. Default `false` so the row variant
   * stays flat against the section card.
   */
  ringed?: boolean;
}

/**
 * Initials-based human avatar. The procedural counterpart to `PetAvatar`
 * — same composition rules (cream disc, gradient ring on hero, ink
 * border) but with letterforms instead of illustration.
 *
 * Single source of truth for the modal hero. The 40px row avatar in
 * `PeopleScreenWithPets` is kept hand-rolled for now (no churn to that
 * file); see HANDOFF.md "Follow-ups" for the proposed wrapper migration.
 */
export function HumanAvatar({
  firstName,
  lastName,
  size = 72,
  ringed = false,
}: HumanAvatarProps) {
  const initials = `${(firstName || '?').charAt(0)}${(lastName || '').charAt(0)}`
    .toUpperCase();

  // Initials font scales with the disc; tuned against pet hero (68px) so
  // the two profiles read at the same optical weight side by side.
  const fontSize = Math.round(size * 0.42);

  const disc = (
    <div
      aria-hidden="true"
      className="rounded-full bg-peach-light border border-cream-dark flex items-center justify-center font-display font-bold text-coral tracking-tight"
      style={{
        width: size,
        height: size,
        fontSize,
        lineHeight: 1,
      }}
    >
      {initials}
    </div>
  );

  if (!ringed) return disc;

  return (
    <div
      aria-hidden="true"
      className="rounded-full p-[3px] bg-gradient-to-br from-brass to-coral"
    >
      <div className="bg-cream rounded-full p-[2px]">{disc}</div>
    </div>
  );
}
