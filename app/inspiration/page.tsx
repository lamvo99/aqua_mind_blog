import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { urlFor } from "@/lib/sanity"
import { getInspirationList } from "@/lib/database"

export const metadata: Metadata = {
  title: "Aquascape Inspiration — AquaMind",
  description: "Aquascape ideas and gallery: nature aquariums, iwagumi, dutch and jungle styles with tank details.",
  alternates: { canonical: "https://aquamind.life/inspiration" },
}

export const dynamic = "force-dynamic"

export default async function InspirationPage() {
  const items = await getInspirationList()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Inspiration</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Real aquascapes with tank details — plants, hardscape and equipment used.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item: any) => (
            <Link
              key={item._id}
              href={`/inspiration/${item.slug?.current}`}
              className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
            >
              <div className="relative aspect-[4/3] bg-aqua-50 dark:bg-slate-900">
                {item.mainImage ? (
                  <Image
                    src={urlFor(item.mainImage).width(600).height(450).url() || ""}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {item.style && (
                    <span className="px-2 py-0.5 rounded-md bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-[10px] font-semibold uppercase tracking-wide">
                      {item.style}
                    </span>
                  )}
                  {item.tankSizeL && (
                    <span className="text-xs text-gray-400 dark:text-slate-500">{item.tankSizeL} L</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">Gallery coming soon</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">We are curating real aquascapes to inspire your next setup.</p>
        </div>
      )}
    </div>
  )
}
