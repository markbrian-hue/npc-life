
import { useState } from 'react';
import {
  ACHIEVEMENTS,
  COSMETICS,
  SHIRT_COLORS,
  achievementProgress,
  cityRank,
  type CosmeticId,
  type ProgressStats,
  type ShirtColorId,
} from './progression';

type Tab = 'wardrobe' | 'achievements';

type Props = {
  inventory: string[];
  equipped: string;
  shirt: ShirtColorId;
  stats: ProgressStats;
  initialTab: Tab;
  onEquip: (id: CosmeticId | 'none') => void;
  onShirt: (id: ShirtColorId) => void;
  onClose: () => void;
};

export function ProgressionPanel({
  inventory,
  equipped,
  shirt,
  stats,
  initialTab,
  onEquip,
  onShirt,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const unlocked = ACHIEVEMENTS.filter(
    (achievement) =>
      achievementProgress(achievement, stats).unlocked
  ).length;

  return (
    <div
      className="progress-backdrop"
      onMouseDown={onClose}
    >
      <section
        className="progress-panel"
        role="dialog"
        aria-modal="true"
        aria-label="NPC progression and wardrobe"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="progress-head">
          <div>
            <span className="progress-eyebrow">
              YOUR ENTIRE PERSONALITY
            </span>
            <h2>NPC PROFILE</h2>
            <p>{cityRank(stats.jobs)}</p>
          </div>

          <button
            className="progress-close"
            aria-label="Close profile"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="progress-tabs">
          <button
            className={
              tab === 'wardrobe' ? 'selected' : ''
            }
            onClick={() => setTab('wardrobe')}
          >
            👕 Wardrobe <small>I</small>
          </button>

          <button
            className={
              tab === 'achievements' ? 'selected' : ''
            }
            onClick={() => setTab('achievements')}
          >
            🏆 Achievements <small>J</small>
          </button>
        </div>

        {tab === 'wardrobe' ? (
          <div className="progress-content">
            <h3>
              Shirt color <span>FREE</span>
            </h3>

            <div className="shirt-options">
              {SHIRT_COLORS.map((color) => (
                <button
                  key={color.id}
                  className={
                    shirt === color.id ? 'selected' : ''
                  }
                  onClick={() => onShirt(color.id)}
                  title={color.name}
                  aria-label={`Wear ${color.name}`}
                  aria-pressed={shirt === color.id}
                >
                  <span
                    style={{
                      background: color.hex,
                    }}
                  />
                  <small>{color.name}</small>
                </button>
              ))}
            </div>

            <h3>
              Head accessories
              <span>
                {inventory.length}/{COSMETICS.length} owned
              </span>
            </h3>

            <div className="wardrobe-grid">
              <button
                className={
                  equipped === 'none' ? 'selected' : ''
                }
                onClick={() => onEquip('none')}
              >
                <span className="wardrobe-emoji">
                  🙂
                </span>
                <strong>Nothing</strong>
                <small>
                  {equipped === 'none'
                    ? 'EQUIPPED'
                    : 'Unequip hat'}
                </small>
              </button>

              {COSMETICS.map((item) => {
                const owned = inventory.includes(item.id);

                return (
                  <button
                    key={item.id}
                    disabled={!owned}
                    className={
                      equipped === item.id
                        ? 'selected'
                        : ''
                    }
                    onClick={() => onEquip(item.id)}
                  >
                    <span className="wardrobe-emoji">
                      {item.emoji}
                    </span>

                    <strong>{item.name}</strong>

                    <small>
                      {!owned
                        ? '🔒 BUY AT SHOP'
                        : equipped === item.id
                          ? 'EQUIPPED'
                          : 'Tap to wear'}
                    </small>
                  </button>
                );
              })}
            </div>

            <p className="progress-footnote">
              Only one head accessory can be equipped
              at a time. Visit the Stupid Shop to unlock
              more.
            </p>
          </div>
        ) : (
          <div className="progress-content">
            <div className="achievement-summary">
              <strong>
                {unlocked}/{ACHIEVEMENTS.length}
              </strong>{' '}
              achievements unlocked
              <span>•</span>
              {stats.jobs} jobs completed
            </div>

            <div className="achievement-list">
              {ACHIEVEMENTS.map((achievement) => {
                const progress = achievementProgress(
                  achievement,
                  stats
                );

                return (
                  <div
                    key={achievement.id}
                    className={`achievement-item ${
                      progress.unlocked
                        ? 'unlocked'
                        : ''
                    }`}
                  >
                    <span className="achievement-icon">
                      {achievement.emoji}
                    </span>

                    <div className="achievement-info">
                      <strong>
                        {achievement.title}
                      </strong>
                      <p>{achievement.description}</p>

                      <div className="achievement-track">
                        <span
                          style={{
                            width: `${
                              Math.min(
                                100,
                                (progress.current /
                                  progress.goal) *
                                  100
                              )
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <small>
                      {progress.unlocked
                        ? '✓ DONE'
                        : `${
                            Math.min(
                              progress.current,
                              progress.goal
                            )
                          }/${progress.goal}`}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
