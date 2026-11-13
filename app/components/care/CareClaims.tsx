import {
  basisLabel,
  buildCareClaims,
  claimStateLabel,
  confidenceLabel,
  formatDisagreement,
  getReviewBadge,
  resolveSources,
  sourceTypeLabel,
  type CareBasisEntry,
  type CareConfidenceEntry,
  type EvidenceSourceRecord,
} from '@/lib/care-evidence'
import { interpretReefCompatibility } from '@/lib/coral-reef-compatibility'

interface CareClaimsProps {
  careBasis?: CareBasisEntry[] | null
  careConfidence?: CareConfidenceEntry[] | null
  sources?: EvidenceSourceRecord[] | null
  reviewStatus?: string
  lastReviewedAt?: string
  growthRisk?: string
  growthRiskNote?: string
  reefCompatibility?: boolean | null
  reefSafetyMeaning?: string
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'warn' | 'ok' }) {
  const classes =
    tone === 'warn'
      ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
      : tone === 'ok'
        ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200'
        : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${classes}`}>{children}</span>
}

export default function CareClaims({
  careBasis,
  careConfidence,
  sources,
  reviewStatus,
  lastReviewedAt,
  growthRisk,
  growthRiskNote,
  reefCompatibility,
  reefSafetyMeaning,
}: CareClaimsProps) {
  const claims = buildCareClaims({ careBasis, careConfidence })
  const reef = interpretReefCompatibility({ reefCompatibility, reefSafetyMeaning })
  if (claims.length === 0 && !growthRisk) return null

  const review = getReviewBadge({ reviewStatus, lastReviewedAt })
  const registry = sources || []

  return (
    <section className="mt-8" aria-labelledby="care-claims-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="care-claims-heading" className="text-lg font-bold text-gray-900 dark:text-slate-100">
          Care claims and evidence
        </h2>
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {review.show && review.detail ? `Reviewed ${review.detail}` : review.label}
        </span>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-gray-600 dark:text-slate-300">
        Confidence describes the evidence for this individual claim. “Evidence supported” does not mean the value is a
        universally accepted aquarium target, and low-confidence or unverified claims must not be read as safe defaults.
      </p>

      <div className="space-y-3">
        {claims.map((claim) => {
          const claimSources = resolveSources(claim.sourceIds, registry)
          const unresolved = claim.state === 'UNVERIFIED' || claim.confidence === 'UNVERIFIED'
          return (
            <article
              key={claim.claimKey}
              className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{claim.label}</h3>
                  <p className="mt-1 text-sm font-medium text-gray-700 dark:text-slate-200">
                    {claim.displayValue || (unresolved ? 'Not verified' : 'Not reported')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge>{basisLabel(claim.basis)}</Badge>
                  <Badge tone={unresolved ? 'warn' : 'neutral'}>{confidenceLabel(claim.confidence)}</Badge>
                  <Badge tone={claim.state === 'VERIFIED' ? 'ok' : 'warn'}>{claimStateLabel(claim.state)}</Badge>
                </div>
              </div>

              {claim.note && (
                <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-slate-300">{claim.note}</p>
              )}

              {claim.disagreements.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Sources disagree — ranges are shown separately, never averaged
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-900 dark:text-amber-200">
                    {claim.disagreements.map((disagreement, index) => (
                      <li key={`${disagreement.sourceId}-${index}`}>
                        {formatDisagreement(disagreement, registry)}
                        {disagreement.note ? ` — ${disagreement.note}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {claim.sourceIds.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-slate-200">Sources</p>
                  {claimSources.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {claimSources.map((source) => (
                        <li key={source.sourceId} className="text-xs text-gray-600 dark:text-slate-300">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-aqua-700 underline decoration-aqua-300 underline-offset-2 dark:text-aqua-300"
                          >
                            {source.title}
                          </a>
                          <span className="ml-2 text-gray-500 dark:text-slate-400">
                            {sourceTypeLabel(source.sourceType)} · accessed {source.accessedAt}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                      Cited source records are not available in this view.
                    </p>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {(growthRisk || growthRiskNote) && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/20">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
            Growth / space risk: {growthRisk || 'Unknown'}
          </h3>
          {growthRiskNote && <p className="mt-1 text-xs leading-relaxed text-red-900 dark:text-red-200">{growthRiskNote}</p>}
        </div>
      )}

      {reef && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Reef compatibility</h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-700 dark:text-slate-300">
            <span className="font-medium">{reef.label}.</span> {reef.detail}
          </p>
        </div>
      )}
    </section>
  )
}
