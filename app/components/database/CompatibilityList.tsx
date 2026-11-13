import Link from "next/link"
import {
  conditionList,
  confidenceLabel,
  entityHref,
  refLabel,
  type RelationshipRef,
} from "@/lib/relationships"

export interface CompatibilityItem {
  ref?: RelationshipRef | null
  conditions?: string[] | null
  confidence?: string | null
}

interface CompatibilityListProps {
  title: string
  items?: CompatibilityItem[] | null
  targetType?: string
}

interface CompatibilityRow {
  key: string
  href: string
  name: string
  conditions: string[]
  confidence: string | null
}

export default function CompatibilityList({
  title,
  items,
  targetType = "species",
}: CompatibilityListProps) {
  const rows: CompatibilityRow[] = (items || [])
    .map((item) => {
      const ref = item?.ref
      if (!ref) return null
      const href = entityHref(ref._type || targetType, ref.slug)
      const name = refLabel(ref)
      if (!href || !name) return null
      return {
        key: ref._id || href,
        href,
        name,
        conditions: conditionList(item.conditions),
        confidence: confidenceLabel(item.confidence),
      }
    })
    .filter((row): row is CompatibilityRow => row !== null)

  if (rows.length === 0) return null

  return (
    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">{title}</h2>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.key}>
            <Link
              href={row.href}
              className="inline-flex px-3 py-1.5 rounded-lg bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-sm hover:bg-aqua-100 dark:hover:bg-aqua-950 transition-colors"
            >
              {row.name}
            </Link>
            {(row.confidence || row.conditions.length > 0) && (
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                {row.confidence && <>Confidence: {row.confidence}. </>}
                {row.conditions.length > 0 && (
                  <>Listed as compatible only under these conditions: {row.conditions.join("; ")}.</>
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
