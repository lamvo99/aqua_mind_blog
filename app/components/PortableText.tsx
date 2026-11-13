import Image from "next/image"
import { urlFor } from "@/lib/sanity"
import ResponsiveTable from "./ResponsiveTable"

function headingId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function renderText(child: any, markDefs: any[] = []) {
  if (!child || typeof child !== 'object') return null
  let text: React.ReactNode = child.text
  if (child.marks?.includes("strong")) text = <strong>{text}</strong>
  if (child.marks?.includes("em")) text = <em>{text}</em>
  if (child.marks?.includes("code")) text = <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm text-aqua-600 dark:text-aqua-400">{text}</code>
  if (child.marks?.includes("strike-through")) text = <s>{text}</s>
  if (child.marks?.includes("underline")) text = <u>{text}</u>
  for (const mark of child.marks || []) {
    if (["strong", "em", "code", "strike-through", "underline"].includes(mark)) continue
    const def = markDefs.find((item) => item?._key === mark)
    if (def?.href) {
      text = (
        <a href={def.href} className="text-aqua-600 underline decoration-aqua-300 underline-offset-2 dark:text-aqua-400">
          {text}
        </a>
      )
    }
  }
  return text
}

function BlockRenderer({ block }: { block: any }) {
  if (!block || typeof block !== "object") return null
  const style = block.style || "normal"
  const childList = Array.isArray(block.children) ? block.children : []
  const markDefs = Array.isArray(block.markDefs) ? block.markDefs : []
  if (!block.listItem && childList.length === 0) return null
  const children = childList.map((child: any, i: number) => (
    <span key={child?._key || i}>{renderText(child, markDefs)}</span>
  ))

  const baseClass = "text-gray-700 dark:text-slate-300 leading-relaxed"
  const headingClass = "font-bold text-gray-900 dark:text-slate-100"

  if (block.listItem) {
    return <li className={baseClass}>{children}</li>
  }

  switch (style) {
    case "h1": return <h1 className={`${headingClass} text-3xl mt-10 mb-4`}>{children}</h1>
    case "h2": {
      const id = headingId(block.children?.map((c: any) => c.text).join(" ") || "")
      return <h2 id={id} className={`${headingClass} text-2xl mt-8 mb-3`}>{children}</h2>
    }
    case "h3": {
      const id = headingId(block.children?.map((c: any) => c.text).join(" ") || "")
      return <h3 id={id} className={`${headingClass} text-xl mt-6 mb-2`}>{children}</h3>
    }
    case "h4": return <h4 className={`${headingClass} text-lg mt-4 mb-2`}>{children}</h4>
    case "blockquote": return (
      <blockquote className="border-l-4 border-aqua-500 pl-4 py-2 my-6 bg-aqua-50/50 dark:bg-aqua-950/20 italic text-gray-600 dark:text-slate-400 rounded-r-lg">
        {children}
      </blockquote>
    )
    default: return <p className={`${baseClass} mb-5`}>{children}</p>
  }
}

function renderListItemText(children: any[], markDefs: any[] = []) {
  if (!Array.isArray(children)) return null
  return children.map((child: any, i: number) => (
    <span key={child?._key || i}>{renderText(child, markDefs)}</span>
  ))
}

export default function PortableText({ value }: { value?: unknown }) {
  if (!Array.isArray(value)) return null

  const blocks: any[] = []
  let currentList: any[] | null = null

  function flushList() {
    if (currentList && currentList.length > 0) {
      const style = currentList[0].block.listItem
      blocks.push({ type: "list", style, items: currentList })
      currentList = null
    }
  }

  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue
    const block = raw as any
    if (!block._type) continue
    if (block._type === "block" && (!Array.isArray(block.children) || block.children.length === 0)) continue
    if (block._type === "image" && !block.asset) continue
    if (block._type === "code" && (typeof block.code !== "string" || block.code.trim() === "")) continue
    if (block._type === "block" && block.listItem) {
      if (!currentList) currentList = []
      currentList.push({ block })
    } else {
      flushList()
      blocks.push({ type: block._type, block })
    }
  }
  flushList()

  return (
    <div className="prose-aqua">
      {blocks.map((item, i) => {
        if (item.type === "list") {
          const Tag = item.style === "number" ? "ol" : "ul"
          return (
            <Tag key={`list-${i}`} className={item.style === "number"
              ? "list-decimal list-inside text-gray-700 dark:text-slate-300 mb-5 space-y-1"
              : "list-disc list-inside text-gray-700 dark:text-slate-300 mb-5 space-y-1"
            }>
              {item.items.map((li: any, j: number) => (
                <li key={`${li.block._key || j}`} className="mb-1">
                  {renderListItemText(li.block.children, li.block.markDefs)}
                </li>
              ))}
            </Tag>
          )
        }
        if (item.type === "image") {
          const imgUrl = item.block.asset ? urlFor(item.block).width(800).height(500).url() : null
          return (
            <figure key={item.block._key || i} className="my-8">
              {imgUrl && (
                <Image
                  src={imgUrl}
                  alt={item.block.alt || ""}
                  width={800}
                  height={500}
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="rounded-xl w-full object-cover"
                />
              )}
              {item.block.caption && (
                <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400 italic">
                  {item.block.caption}
                </figcaption>
              )}
            </figure>
          )
        }
        if (item.type === "code") {
          return (
            <div key={item.block._key || i} className="my-6 rounded-xl overflow-hidden bg-slate-900 dark:bg-slate-950">
              {item.block.filename && (
                <div className="px-4 py-2 bg-slate-800 dark:bg-slate-900 text-xs text-slate-400 border-b border-slate-700">
                  {item.block.filename}
                </div>
              )}
              <pre className="p-4 overflow-x-auto text-sm text-slate-200">
                <code>{item.block.code}</code>
              </pre>
            </div>
          )
        }
        if (item.type === "table") {
          return <ResponsiveTable key={item.block._key || i} data={item.block} />
        }
        if (item.type === "block") {
          return <BlockRenderer key={item.block._key || i} block={item.block} />
        }
        return null
      })}
    </div>
  )
}
