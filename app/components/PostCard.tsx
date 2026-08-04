import Link from "next/link"
import Image from "next/image"
import { urlFor } from "@/lib/sanity"
import { formatDateShort, estimateReadingTime } from "@/lib/utils"
import { Calendar, User, Clock } from "lucide-react"
import strings from "@/lib/i18n/strings"

interface PostCardProps {
  post: any
  featured?: boolean
}

export default function PostCard({ post, featured }: PostCardProps) {
  const imageUrl = post.mainImage ? urlFor(post.mainImage).width(featured ? 800 : 600).height(featured ? 450 : 400).url() : null
  const readingTime = estimateReadingTime(post.body)

  return (
    <Link
      href={`/posts/${post.slug.current}`}
      className={`group block rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 card-hover ${featured ? "lg:col-span-2" : ""}`}
    >
      <div className={`relative ${featured ? "h-64 md:h-80" : "h-52"} overflow-hidden`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-aqua-100 to-ocean-100 dark:from-aqua-950 dark:to-ocean-950 flex items-center justify-center">
            <span className="text-aqua-300 dark:text-aqua-700 text-4xl">🌿</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {post.isFeatured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-aqua-500 text-white text-xs font-semibold rounded-lg">
            {strings.home.featured}
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {post.categories?.slice(0, 2).map((cat: any) => (
            <span
              key={cat.slug.current}
              className="px-2.5 py-0.5 bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-xs font-medium rounded-full"
            >
              {cat.title}
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 ml-auto">
            <Clock className="w-3 h-3" />
            {readingTime} {strings.posts.readingTime}
          </span>
        </div>
        <h3 className={`font-bold text-gray-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors ${featured ? "text-2xl" : "text-lg"}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
          {post.author && (
            <span className="flex items-center gap-1.5">
              {post.author.image ? (
                <Image
                  src={urlFor(post.author.image).width(20).height(20).url() || ""}
                  alt={post.author.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
              {post.author.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDateShort(post.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}
