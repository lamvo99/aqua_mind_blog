export function formatDate(date: string, locale = "en-US") {
  return new Date(date).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateShort(date: string, locale = "en-US") {
  return new Date(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateNumeric(date: string, locale = "en-US") {
  return new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatRelativeTime(date: string, locale = "en-US") {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  const diff = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) return formatDateShort(date, locale)
  if (days > 0) return rtf.format(-days, "day")
  if (hours > 0) return rtf.format(-hours, "hour")
  if (minutes > 0) return rtf.format(-minutes, "minute")
  return rtf.format(-seconds, "second")
}

export const numberFormat = (num: number, locale = "vi-VN") =>
  new Intl.NumberFormat(locale).format(num)

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}

export function estimateReadingTime(body: any[] | undefined) {
  if (!body) return 1
  const text = body
    .filter((block: any) => block._type === "block")
    .map((block: any) => block.children?.map((child: any) => child.text).join(" "))
    .join(" ")
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}
