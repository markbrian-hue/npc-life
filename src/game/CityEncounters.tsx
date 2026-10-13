import type {MutableRefObject} from 'react';
import type {LivingRuntime} from './LivingCity';
import { citizenPositions } from './citizenPositions';
import { GameDialog } from './ui/GameDialog';
import { useGameUI } from './ui/GameUI';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { PlayerLocation } from './Player';
import { playGameSound } from './gameAudio';
import { distance2D } from './world';

import {
  ENCOUNTER_KEY,
  STREET_NPCS,
  dailyRumor,
  freshEncounters,
  loadEncounters,
  type StreetNpc,
  type EncounterProgress,
} from './alpha7';

import './encounters.css';

type Props = {
  environment:MutableRefObject<LivingRuntime>;
  player: PlayerLocation;
  reputation: number;
  disabled: boolean;
  onReward: (
    coins: number,
    reputation: number
  ) => void;
};

export function CityEncounters({
  environment,
  player,
  reputation,
  disabled,
  onReward,
}: Props) {
  const { menu, store } = useGameUI();
  const [progress, setProgress] =
    useState<EncounterProgress>(loadEncounters);

  const [selected, setSelected] =
    useState<StreetNpc | null>(null);

  const [reply, setReply] = useState('');
  const [notice, setNotice] = useState('');

  const rewardLock = useRef(false);

  // Save encounters separately from other progress.
  useEffect(() => {
    try {
      localStorage.setItem(
        ENCOUNTER_KEY,
        JSON.stringify(progress)
      );
    } catch {
      // Local storage may be disabled.
    }
  }, [progress]);

  // Reset on a new local day, even with the tab open.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((p) => freshEncounters(p));
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  // Find the nearest special citizen.
  const near = useMemo(() => {
    const options = STREET_NPCS
      .map((npc) => ({
        npc,
        distance: distance2D(
          player.x,
          player.z,
          (citizenPositions.get(npc.id) || npc).x,
          (citizenPositions.get(npc.id) || npc).z
        ),
      }))
      .filter(({ distance }) => distance < 3.25)
      .sort((a, b) => a.distance - b.distance);

    return options[0]?.npc ?? null;
  }, [player]);

  function close() {
    setSelected(null);
    setReply('');
    setNotice('');
    rewardLock.current = false;
    store.close('encounter');
  }

  function open(npc: StreetNpc) {
    if (disabled || !store.open('encounter')) return;

    setProgress((p) => freshEncounters(p));
    rewardLock.current = false;

    setSelected(npc);
    setReply('');
    setNotice('');

    playGameSound('talk');
  }

  // F is independent from the existing E interactions.
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (store.getSnapshot() !== null) return;
      if (
        event.code === 'KeyF' &&
        !event.repeat &&
        !selected &&
        near &&
        !disabled
      ) {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest(
            'input, textarea, select, [contenteditable="true"]'
          )
        ) {
          return;
        }

        event.preventDefault();
        open(near);
      }
    };

    window.addEventListener('keydown', key);

    return () =>
      window.removeEventListener('keydown', key);
  });

  function choose(index: 0 | 1) {
    if (!selected || rewardLock.current) return;

    rewardLock.current = true;

    const answer = selected.choices[index];
    const today = freshEncounters(progress);

    const first =
      !today.rewarded.includes(selected.id);

    const next: EncounterProgress = {
      ...today,
      visits: today.visits + 1,
      rewarded: first
        ? [...today.rewarded, selected.id]
        : today.rewarded,
    };

    setProgress(next);
    setReply(answer.reply);

    setNotice(
      first
        ? `First conversation today: +${answer.coins} Coins, +${answer.reputation} REP`
        : 'Already earned a reward from this citizen today.'
    );

    if (first) {
      onReward(
        answer.coins,
        answer.reputation
      );

      playGameSound('coin');
    } else {
      playGameSound('talk');
    }
  }

  const rumor = selected
    ? dailyRumor(
        selected.id,
        progress.visits
      )
    : '';

  const greeted =
    selected && reputation >= 100
      ? `${selected.name}: The famous city nuisance is here. Please do not start a parade.`
      : selected?.greeting;

  return (
    <>
      {/* Nearby interaction prompt */}
      {!disabled && !selected && near && (
        <button
          className="encounter-prompt"
          onClick={() => open(near)}
        >
          <kbd>F</kbd>
          Talk to {near.name} · {near.title}
        </button>
      )}

      {/* Daily street-gossip progress */}
      <div
        className="encounter-hud"
        aria-label="Daily conversations"
      >
        STREET GOSSIP
        <strong>
          {freshEncounters(progress).rewarded.length}/
          {STREET_NPCS.length}
        </strong>
      </div>

      {/* Conversation modal */}
      {selected && menu === 'encounter' && (
        <GameDialog id="encounter" className="encounter-dialog" label={`Talk to ${selected.name}`} onClose={close}>
            <div className="encounter-heading">
              <div>
                <small>IDIOT CITY RESIDENT</small>
                <h2>{selected.name}</h2>
                <span>{selected.title}</span>
              </div>

              <button
                aria-label="Close conversation"
                onClick={close}
              >
                ×
              </button>
            </div>

            <p className="encounter-greeting">
              {greeted}
            </p>

            <p className="encounter-rumor">
              ON THE STREET: {rumor}<br/>{environment.current.env.rain>.25?'Rain brings better-paid delivery shifts. Check L. Umbrella insurance remains a scam.':environment.current.env.minute>1200?'The convenience store is always open. Free benches restore energy.':'F opens food menus, O opens your bag. The bureau offers free meals and water when needs are low.'}
            </p>

            <p className="encounter-question">
              {reply || selected.question}
            </p>

            {notice && (
              <p
                className="encounter-notice"
                role="status"
              >
                {notice}
              </p>
            )}

            <div className="encounter-choices">
              {reply ? (
                <button onClick={close}>
                  Leave dramatically
                </button>
              ) : (
                selected.choices.map(
                  (choice, index) => (
                    <button
                      key={choice.label}
                      onClick={() =>
                        choose(index as 0 | 1)
                      }
                    >
                      {choice.label}
                      <small>
                        {choice.coins
                          ? `+${choice.coins} Coins`
                          : `+${choice.reputation} REP`}
                        {' '}(once/day)
                      </small>
                    </button>
                  )
                )
              )}
            </div>
        </GameDialog>
      )}
    </>
  );
}
