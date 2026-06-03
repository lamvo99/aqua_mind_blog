export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

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
