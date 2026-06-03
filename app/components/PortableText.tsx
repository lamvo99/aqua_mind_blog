import Image from "next/image"
import { urlFor } from "@/lib/sanity"

function BlockRenderer({ block }: { block: any }) {
  const style = block.style || "normal"

  const children = block.children?.map((child: any, i: number) => {
    let text = child.text
    if (child.marks?.includes("strong")) text = <strong key={i}>{text}</strong>
    if (child.marks?.includes("em")) text = <em key={i}>{text}</em>
    if (child.marks?.includes("underline")) text = <u key={i}>{text}</u>
    if (child.marks?.includes("code")) text = <code key={i} className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm text-aqua-600 dark:text-aqua-400">{text}</code>
    if (child.marks?.includes("strike-through")) text = <s key={i}>{text}</s>
    if (Array.isArray(text)) return text
    return text
  })

  const baseClass = "text-gray-700 dark:text-slate-300 leading-relaxed"
  const headingClass = "font-bold text-gray-900 dark:text-slate-100"

  switch (style) {
    case "h1": return <h1 className={`${headingClass} text-3xl mt-10 mb-4`}>{children}</h1>
    case "h2": return <h2 className={`${headingClass} text-2xl mt-8 mb-3`}>{children}</h2>
    case "h3": return <h3 className={`${headingClass} text-xl mt-6 mb-2`}>{children}</h3>
    case "h4": return <h4 className={`${headingClass} text-lg mt-4 mb-2`}>{children}</h4>
    case "blockquote": return (
      <blockquote className="border-l-4 border-aqua-500 pl-4 py-2 my-6 bg-aqua-50/50 dark:bg-aqua-950/20 italic text-gray-600 dark:text-slate-400 rounded-r-lg">
        {children}
      </blockquote>
    )
    default: return <p className={`${baseClass} mb-5`}>{children}</p>
  }
}

export default function PortableText({ value }: { value: any[] }) {
  return (
    <div className="prose-aqua">
      {value?.map((block: any) => {
        if (block._type === "block") {
          return (
            <div key={block._key}>
              <BlockRenderer block={block} />
              {block.level === 1 && block.listItem === "bullet" && (
                <ul className="list-disc list-inside text-gray-700 dark:text-slate-300 mb-4 space-y-1">
                  {block.children?.map((child: any, i: number) => (
                    <li key={i}>{child.text}</li>
                  ))}
                </ul>
              )}
              {block.listItem === "number" && (
                <ol className="list-decimal list-inside text-gray-700 dark:text-slate-300 mb-4 space-y-1">
                  {block.children?.map((child: any, i: number) => (
                    <li key={i}>{child.text}</li>
                  ))}
                </ol>
              )}
            </div>
          )
        }
        if (block._type === "image") {
          const imgUrl = block.asset ? urlFor(block).width(800).height(500).url() : null
          return (
            <figure key={block._key} className="my-8">
              {imgUrl && (
                <Image
                  src={imgUrl}
                  alt={block.alt || ""}
                  width={800}
                  height={500}
                  className="rounded-xl w-full object-cover"
                />
              )}
              {block.caption && (
                <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400 italic">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          )
        }
        if (block._type === "code") {
          return (
            <div key={block._key} className="my-6 rounded-xl overflow-hidden bg-slate-900 dark:bg-slate-950">
              {block.filename && (
                <div className="px-4 py-2 bg-slate-800 dark:bg-slate-900 text-xs text-slate-400 border-b border-slate-700">
                  {block.filename}
                </div>
              )}
              <pre className="p-4 overflow-x-auto text-sm text-slate-200">
                <code>{block.code}</code>
              </pre>
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
