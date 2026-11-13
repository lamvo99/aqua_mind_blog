import Link from "next/link"
import { GitBranch } from "lucide-react"
import { refHref, refLabel, type RelationshipRef } from "@/lib/relationships"

interface ParentLinkProps {
  parent?: RelationshipRef | null
  label?: string
}

export default function ParentLink({ parent, label = "Variant of" }: ParentLinkProps) {
  const href = refHref(parent)
  const name = refLabel(parent)
  if (!href || !name) return null

  return (
    <p className="mt-2 mb-4 inline-flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
      <GitBranch className="w-3.5 h-3.5 text-aqua-500 shrink-0" aria-hidden="true" />
      <span>{label}:</span>
      <Link href={href} className="font-medium text-aqua-600 dark:text-aqua-400 hover:underline">
        {name}
      </Link>
    </p>
  )
}
