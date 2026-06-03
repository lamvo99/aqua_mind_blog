import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface Crumb {
  label: string
  href?: string
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
      <Link href="/" className="hover:text-aqua-600 dark:hover:text-aqua-400 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          {item.href ? (
            <Link href={item.href} className="hover:text-aqua-600 dark:hover:text-aqua-400 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-slate-100 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
