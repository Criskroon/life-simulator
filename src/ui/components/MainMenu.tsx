import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/state/gameStore';

export function MainMenu() {
  const [hasSave, setHasSave] = useState(false);
  const checkSave = useGameStore((s) => s.hasSave);
  const loadSavedGame = useGameStore((s) => s.loadSavedGame);

  useEffect(() => {
    void checkSave().then(setHasSave);
  }, [checkSave]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-phone">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 text-center">
          Real Life Sim
        </h1>
        <p className="text-slate-500 text-center mb-10">
          A life is a series of choices. Most of them are small.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => useGameStore.setState({ screen: 'newLife' })}
            className="bg-slate-900 text-white font-semibold rounded-xl py-4 active:scale-95 transition"
          >
            Start a New Life
          </button>
          {hasSave && (
            <button
              type="button"
              onClick={() => void loadSavedGame()}
              className="bg-white text-slate-900 font-semibold rounded-xl py-4 border border-slate-300 active:scale-95 transition"
            >
              Continue Previous Life
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center mt-12">
          Saves are stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
