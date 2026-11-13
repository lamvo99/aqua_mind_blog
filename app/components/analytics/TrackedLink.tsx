"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { trackDatabaseEvent, type DatabaseEventName, type DatabaseEventProps } from "@/lib/analytics"

export default function TrackedLink({
  href,
  className,
  children,
  event = "database_result_opened",
  props,
}: {
  href: string
  className?: string
  children: ReactNode
  event?: DatabaseEventName
  props?: DatabaseEventProps
}) {
  return (
    <Link href={href} className={className} onClick={() => trackDatabaseEvent(event, props)}>
      {children}
    </Link>
  )
}
