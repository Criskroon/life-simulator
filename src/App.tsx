import { useGameStore } from './game/state/gameStore';
import { AppShell } from './ui/layout/AppShell';
import { MainMenu } from './ui/components/MainMenu';
import { NewLifeScreen } from './ui/screens/NewLifeScreen';
import { GameScreen } from './ui/screens/GameScreen';
import { DeathScreen } from './ui/screens/DeathScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <AppShell>
      {screen === 'menu' && <MainMenu />}
      {screen === 'newLife' && <NewLifeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'death' && <DeathScreen />}
    </AppShell>
  );
}
