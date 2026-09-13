/**
 * The four component scores as labelled bars.
 *
 * This component invents nothing: every number comes straight from the
 * matcher's response. The maximum for each row is the matcher's weight, so
 * the bars are directly comparable to the formula in the README.
 */

import { SCORE_WEIGHTS, type MatchScores } from "@/types";

function ScoreRow({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const percent = max === 0 ? 0 : Math.round((score / max) * 100);

  return (
    <div className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3">
      <span className="text-xs text-slate-600">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <span
          className="block h-full rounded-full bg-green-700"
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="tabular text-right text-xs text-slate-700">
        {score.toFixed(1)}/{max}
      </span>
    </div>
  );
}

export default function MatchBreakdown({ scores }: { scores: MatchScores }) {
  return (
    <div className="space-y-2">
      <ScoreRow label="Skills" score={scores.skill_score} max={SCORE_WEIGHTS.skills} />
      <ScoreRow
        label="Interests"
        score={scores.interest_score}
        max={SCORE_WEIGHTS.interests}
      />
      <ScoreRow label="Role" score={scores.role_score} max={SCORE_WEIGHTS.role} />
      <ScoreRow label="Growth" score={scores.growth_score} max={SCORE_WEIGHTS.growth} />
    </div>
  );
}
