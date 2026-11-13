"use client"

import { useEffect } from "react"
import { trackDatabaseEvent, type DatabaseEventName, type DatabaseEventProps } from "@/lib/analytics"

export default function EventOnMount({
  event,
  props,
}: {
  event: DatabaseEventName
  props?: DatabaseEventProps
}) {
  const key = JSON.stringify(props ?? {})
  useEffect(() => {
    trackDatabaseEvent(event, JSON.parse(key) as DatabaseEventProps)
  }, [event, key])
  return null
}
