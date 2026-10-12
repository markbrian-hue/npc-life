
import {
  DAILY_CHALLENGES,
  challengeProgress,
  reputationInfo,
  type ChallengeId,
  type DailyProgress,
} from './alpha6';

type Props = {
  daily: DailyProgress;
  reputation: number;
  onClaim: (id: ChallengeId) => void;
  onClose: () => void;
};

export function DailyBoard({
  daily,
  reputation,
  onClaim,
  onClose,
}: Props) {
  const rep = reputationInfo(reputation);

  return (
    <div
      className="alpha6-overlay"
      onMouseDown={onClose}
    >
      <section
        className="alpha6-board"
        role="dialog"
        aria-modal="true"
        aria-label="Daily challenges"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="alpha6-heading">
          <div>
            <small>
              NEW OBJECTIVES EVERY LOCAL DAY
            </small>
            <h2>📋 DAILY NONSENSE</h2>
            <p>
              Today: {daily.day}. Rewards require
              manual claiming.
            </p>
          </div>

          <button
            aria-label="Close challenges"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="alpha6-rep-card">
          <span>YOUR REPUTATION</span>
          <strong>{rep.title}</strong>
          <p>
            {rep.points} REP{' '}
            {rep.next === null
              ? '· MAX RANK'
              : `· ${rep.next} FOR NEXT RANK`}
          </p>

          <div className="alpha6-track">
            <span
              style={{
                width: `${rep.progress * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="alpha6-challenge-list">
          {DAILY_CHALLENGES.map((challenge) => {
            const count = challengeProgress(
              daily,
              challenge.id
            );

            const complete =
              count >= challenge.target;

            const claimed =
              daily.claimed.includes(challenge.id);

            return (
              <div
                className="alpha6-challenge"
                key={challenge.id}
              >
                <span className="alpha6-challenge-icon">
                  {challenge.icon}
                </span>

                <div className="alpha6-challenge-details">
                  <strong>{challenge.title}</strong>
                  <p>{challenge.description}</p>

                  <small>
                    {Math.min(
                      count,
                      challenge.target
                    )}/{challenge.target}{' '}
                    · +{challenge.coins} ◆
                    · +{challenge.reputation} REP
                  </small>
                </div>

                <button
                  disabled={!complete || claimed}
                  onClick={() =>
                    onClaim(challenge.id)
                  }
                >
                  {claimed
                    ? 'Claimed ✓'
                    : complete
                      ? 'Claim'
                      : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="alpha6-note">
          Challenges reset at local midnight.
          Coins and reputation do not reset.
          Progress is saved in this browser only.
        </p>
      </section>
    </div>
  );
}
