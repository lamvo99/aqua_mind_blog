import Link from "next/link"
import { entityHref, refLabel, type RelationshipRef } from "@/lib/relationships"

export interface PredatorPreyItem {
  ref?: RelationshipRef | null
  sizeCondition?: string | null
  evidenceNote?: string | null
}

interface PredatorPreySectionProps {
  items?: PredatorPreyItem[] | null
  title?: string
  description?: string
  showEvidence?: boolean
}

interface PredatorPreyRow {
  key: string
  href: string
  name: string
  note: string | null
  evidence: string | null
}

const DEFAULT_DESCRIPTION =
  "Species this invertebrate is documented as preying on. Size notes describe when predation is most likely."

function nonEmptyText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export default function PredatorPreySection({
  items,
  title = "Predator & prey",
  description = DEFAULT_DESCRIPTION,
  showEvidence = false,
}: PredatorPreySectionProps) {
  const rows: PredatorPreyRow[] = (items || [])
    .map((item) => {
      const ref = item?.ref
      if (!ref) return null
      const href = entityHref(ref._type, ref.slug)
      const name = refLabel(ref)
      if (!href || !name) return null
      return {
        key: ref._id || href,
        href,
        name,
        note: nonEmptyText(item.sizeCondition),
        evidence: nonEmptyText(item.evidenceNote),
      }
    })
    .filter((row): row is PredatorPreyRow => row !== null)
    // The field is an authored list; guard against the same prey being added twice.
    .filter((row, index, all) => all.findIndex((other) => other.href === row.href) === index)

  if (rows.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
      <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">{title}</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">{description}</p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((row) => (
          <li
            key={row.key}
            className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Prey
            </span>
            <div className="mt-0.5">
              <Link
                href={row.href}
                className="text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:underline"
              >
                {row.name}
              </Link>
            </div>
            {row.note && (
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">{row.note}</p>
            )}
            {showEvidence && row.evidence && (
              <p className="mt-1 text-[11px] leading-relaxed text-gray-400 dark:text-slate-500">
                Evidence: {row.evidence}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
