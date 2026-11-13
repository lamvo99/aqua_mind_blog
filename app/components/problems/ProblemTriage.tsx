import { AlertTriangle, ArrowUpRight, ClipboardCheck, Info, ShieldAlert, Stethoscope } from 'lucide-react'
import PortableText from '@/app/components/PortableText'
import {
  getReviewBadge,
  hasRealReview,
  sourceTypeLabel,
  type EvidenceSourceRecord,
} from '@/lib/care-evidence'
import {
  TRIAGE_DISCLAIMER,
  TRIAGE_SECTION_ORDER,
  deriveTriageCoverage,
  hasBlocks,
  triageCoverageLabel,
  type ProblemTriageDraft,
  type TriageSectionKey,
} from '@/lib/problem-triage'

const SECTION_ICONS: Record<TriageSectionKey, React.ReactNode> = {
  symptoms: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  immediateAction: <ClipboardCheck className="h-5 w-5 text-green-600 dark:text-green-400" />,
  whatToCheck: <Stethoscope className="h-5 w-5 text-aqua-500" />,
  causes: <Info className="h-5 w-5 text-aqua-500" />,
  whatNotToDo: <ShieldAlert className="h-5 w-5 text-red-500" />,
  howToDistinguish: <Info className="h-5 w-5 text-gray-500" />,
  treatment: <ClipboardCheck className="h-5 w-5 text-aqua-500" />,
  recovery: <Info className="h-5 w-5 text-gray-500" />,
  monitoring: <Stethoscope className="h-5 w-5 text-aqua-500" />,
  escalation: <ShieldAlert className="h-5 w-5 text-red-600" />,
  prevention: <Info className="h-5 w-5 text-green-600 dark:text-green-400" />,
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
        {icon}
        {title}
      </h2>
      <div className="leading-relaxed text-gray-600 dark:text-slate-300">{children}</div>
    </section>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'neutral' | 'warn' | 'danger' }) {
  const classes =
    tone === 'danger'
      ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200'
      : tone === 'warn'
        ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
        : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${classes}`}>{children}</span>
}

export default function ProblemTriage({
  record,
  sources,
}: {
  record: ProblemTriageDraft
  sources?: EvidenceSourceRecord[]
}) {
  const coverage = deriveTriageCoverage(record)
  const review = getReviewBadge({ reviewStatus: record.reviewStatus, lastReviewedAt: record.lastReviewedAt })
  const sourceList = sources || record.evidenceSources || []
  const coverageByKey = new Map(coverage.map((item) => [item.key, item]))
  const draftUrgency =
    !!record.severity || !!record.timeSensitivity
      ? !hasRealReview({ reviewStatus: record.reviewStatus, lastReviewedAt: record.lastReviewedAt })
      : false

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-aqua-100 bg-aqua-50 p-4 dark:border-aqua-900 dark:bg-aqua-950/30">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{review.show && review.detail ? `Reviewed ${review.detail}` : review.label}</Badge>
          {record.severity && <Badge tone={record.severity === 'CRITICAL' ? 'danger' : 'warn'}>Severity: {record.severity}</Badge>}
          {record.timeSensitivity && (
            <Badge tone={record.timeSensitivity === 'ACT_NOW' ? 'danger' : record.timeSensitivity === 'ACT_SOON' ? 'warn' : 'neutral'}>
              Time sensitivity: {record.timeSensitivity.replace('_', ' ')}
            </Badge>
          )}
          {!record.severity && !record.timeSensitivity && <Badge tone="neutral">Urgency not yet classified</Badge>}
          {draftUrgency && <Badge tone="warn">Draft urgency — not clinically reviewed</Badge>}
        </div>
        {draftUrgency && (
          <p className="mt-2 text-xs font-medium leading-relaxed text-amber-900 dark:text-amber-200">
            Do not use draft urgency as verified guidance. It does not trigger treatment instructions.
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-gray-700 dark:text-slate-300">{TRIAGE_DISCLAIMER}</p>
      </div>

      {TRIAGE_SECTION_ORDER.map((section) => {
        const blocks = record[section.key]
        if (!hasBlocks(blocks)) return null
        if (section.key === 'escalation') {
          return (
            <section
              key={section.key}
              className="mb-4 rounded-2xl border-2 border-red-300 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/30"
              aria-labelledby="escalation-heading"
            >
              <h2 id="escalation-heading" className="mb-3 flex items-center gap-2 text-lg font-bold text-red-900 dark:text-red-200">
                <ShieldAlert className="h-5 w-5" />
                {section.label}
              </h2>
              <div className="leading-relaxed text-red-900 dark:text-red-200">
                <PortableText value={blocks} />
                {record.whenToSeekHelp && <p className="mt-2 text-sm font-medium">{record.whenToSeekHelp}</p>}
              </div>
            </section>
          )
        }
        return (
          <Section key={section.key} title={section.label} icon={SECTION_ICONS[section.key]}>
            <PortableText value={blocks} />
          </Section>
        )
      })}

      {!hasBlocks(record.escalation) && record.whenToSeekHelp && (
        <section className="mb-4 rounded-2xl border-2 border-red-300 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/30">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-red-900 dark:text-red-200">
            <ShieldAlert className="h-5 w-5" />
            Escalation / when to seek help
          </h2>
          <p className="text-sm leading-relaxed text-red-900 dark:text-red-200">{record.whenToSeekHelp}</p>
        </section>
      )}

      {coverageByKey.get('treatment')?.state === 'NOT_YET_VERIFIED' && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Treatment not yet verified</h2>
          <p className="mt-1 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            No medication, dosage or chemical treatment protocol is provided for this record. {coverageByKey.get('treatment')?.note || ''}
          </p>
        </div>
      )}

      {sourceList.length > 0 && (
        <Section title="Sources and review status" icon={<Info className="h-5 w-5 text-aqua-500" />}>
          <ul className="space-y-2">
            {sourceList.map((source) => (
              <li key={source.sourceId} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-aqua-700 underline decoration-aqua-300 underline-offset-2 dark:text-aqua-300"
                >
                  {source.title}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                  {sourceTypeLabel(source.sourceType)} · accessed {source.accessedAt}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <details className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <summary className="cursor-pointer text-sm font-semibold text-gray-900 dark:text-slate-100">
          Triage coverage ({coverage.filter((item) => item.state !== 'NOT_YET_RESEARCHED').length}/{coverage.length} sections with a state)
        </summary>
        <ul className="mt-3 space-y-1">
          {coverage.map((item) => (
            <li key={item.key} className="text-xs text-gray-600 dark:text-slate-300">
              <span className="font-medium text-gray-800 dark:text-slate-200">{item.label}:</span>{' '}
              {triageCoverageLabel(item.state)}
              {item.note ? ` — ${item.note}` : ''}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
