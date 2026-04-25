import { useState } from 'react';
import { COUNTRIES } from '../../game/data/countries';
import { useGameStore } from '../../game/state/gameStore';
import type { Gender } from '../../game/types/gameState';

export function NewLifeScreen() {
  const startNewLife = useGameStore((s) => s.startNewLife);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [countryId, setCountryId] = useState(COUNTRIES[0]?.id ?? 'NL');

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-phone">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Start a New Life</h2>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <Field label="First name (optional)">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Random"
              className="w-full bg-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
            />
          </Field>
          <Field label="Last name (optional)">
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Random"
              className="w-full bg-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
            />
          </Field>
          <Field label="Gender">
            <div className="flex gap-2">
              {(['female', 'male', 'nonbinary'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2 rounded-lg capitalize text-sm ${
                    gender === g
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Country">
            <div className="grid grid-cols-3 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCountryId(c.id)}
                  className={`py-2 rounded-lg text-sm ${
                    countryId === c.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Field>

          <button
            type="button"
            onClick={() =>
              startNewLife({
                firstName: firstName.trim() || undefined,
                lastName: lastName.trim() || undefined,
                gender,
                countryId,
              })
            }
            className="w-full bg-slate-900 text-white font-semibold rounded-xl py-3 active:scale-95 transition mt-2"
          >
            Be Born
          </button>
        </div>

        <button
          type="button"
          onClick={() => useGameStore.getState().goToMenu()}
          className="w-full text-slate-500 text-sm mt-4 underline"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
