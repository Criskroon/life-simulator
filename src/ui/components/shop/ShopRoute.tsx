import { useState } from 'react';
import type { PlayerState } from '../../../game/types/gameState';
import { useComingSoon } from '../ComingSoonHandler';
import { AutoDealerStore } from './AutoDealerStore';
import { ShopHub } from './ShopHub';
import { STORES, type StoreId } from './shopData';

interface ShopRouteProps {
  player: PlayerState;
  /** Where the Shop should open. `null` = Hub, otherwise a store id. */
  initialStoreId: StoreId | null;
  /** Close the entire Shop sub-flow. */
  onClose: () => void;
}

/**
 * Two-level orchestrator for the Shop sub-flow. Starts on either the
 * Hub or a specific Level-3 store (deep-linked from the Assets pills),
 * and tracks navigation between them. Non-functional store ids fall
 * back to the Hub with a Coming-soon toast — that path matters when
 * Assets pills like "Real Estate" route here in this session.
 *
 * Both levels are full-screen modals (z-50) that mount one at a time.
 * Closing from either level fires the parent `onClose`, returning to
 * whatever was beneath the modal stack (Activities Menu or Assets tab).
 */
export function ShopRoute({ player, initialStoreId, onClose }: ShopRouteProps) {
  const { showComingSoon } = useComingSoon();

  const [activeStoreId, setActiveStoreId] = useState<StoreId | null>(() => {
    if (initialStoreId === null) return null;
    const store = STORES.find((s) => s.id === initialStoreId);
    if (!store) return null;
    if (!store.functional) {
      // Deep-link to a not-yet-built store — surface a toast on first
      // paint and land the user on the Hub instead.
      window.queueMicrotask(() =>
        showComingSoon(store.name, store.comingSoonDetail),
      );
      return null;
    }
    return initialStoreId;
  });

  if (activeStoreId === 'auto-dealer') {
    return (
      <AutoDealerStore
        player={player}
        onBack={() => setActiveStoreId(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <ShopHub
      player={player}
      onOpenStore={(storeId) => setActiveStoreId(storeId)}
      onClose={onClose}
    />
  );
}
