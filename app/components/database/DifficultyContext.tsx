import {
  confidenceLabel,
  sourceDisplayTitle,
  type EvidenceSourceRecord,
} from '@/lib/care-evidence'

interface DifficultyContextProps {
  difficulty?: string | null
  context?: string | null
  confidence?: string | null
  contested?: boolean
  sources?: EvidenceSourceRecord[] | null
  notRecommendedFor?: string[] | null
  suitabilityConditions?: string | null
  reviewed?: boolean
}

export default function DifficultyContext({
  difficulty,
  context,
  confidence,
  contested = false,
  sources,
  notRecommendedFor,
  suitabilityConditions,
  reviewed = false,
}: DifficultyContextProps) {
  if (!context && !notRecommendedFor?.length) return null
  return (
    <section
      className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20"
      aria-labelledby="difficulty-context-heading"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="difficulty-context-heading" className="text-sm font-semibold text-amber-950 dark:text-amber-100">
          Difficulty qualification
        </h3>
        {contested && (
          <span className="rounded-full border border-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:border-amber-700 dark:text-amber-200">
            Stored label contested
          </span>
        )}
        {!reviewed && (
          <span className="rounded-full border border-amber-300 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-800 dark:text-amber-200">
            Draft context — not approved
          </span>
        )}
        {confidence && (
          <span className="text-[11px] text-amber-900 dark:text-amber-200">{confidenceLabel(confidence)}</span>
        )}
      </div>

      {difficulty && (
        <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">
          Stored difficulty remains <strong>{difficulty}</strong>; this is a qualification, not a rewritten enum.
        </p>
      )}
      {context && <p className="mt-1 text-sm leading-relaxed text-amber-950 dark:text-amber-100">{context}</p>}
      {suitabilityConditions && (
        <p className="mt-2 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          Applies when: {suitabilityConditions}
        </p>
      )}

      {notRecommendedFor && notRecommendedFor.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-amber-950 dark:text-amber-100">Not recommended for</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-900 dark:text-amber-200">
            {notRecommendedFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {sources && sources.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-amber-950 dark:text-amber-100">Context sources</p>
          <ul className="mt-1 space-y-1">
            {sources.map((source) => (
              <li key={source.sourceId} className="text-xs">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-amber-900 underline decoration-amber-400 underline-offset-2 dark:text-amber-200"
                >
                  {sourceDisplayTitle(source)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

    </section>
  )
}
