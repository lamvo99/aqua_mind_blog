import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const TYPE_PATHS: Record<string, string[]> = {
  post: ["/", "/posts"],
  species: ["/species"],
  plant: ["/plants"],
  coral: ["/corals"],
  equipment: ["/equipment"],
  problem: ["/problems"],
  inspiration: ["/inspiration"],
  category: ["/", "/posts"],
  author: ["/posts"],
}

const TYPE_DETAIL_SEGMENT: Record<string, string> = {
  post: "posts",
  species: "species",
  plant: "plants",
  coral: "corals",
  equipment: "equipment",
  problem: "problems",
  inspiration: "inspiration",
}

export async function POST(request: NextRequest) {
  const secret =
    request.headers.get("x-verification-key") || request.nextUrl.searchParams.get("secret")

  if (!process.env.SANITY_REVALIDATE_SECRET || secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false, error: "Invalid secret" }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ revalidated: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const type: string = body._type
  const slug: string | undefined = body.slug?.current

  if (type && TYPE_DETAIL_SEGMENT[type]) {
    const segment = TYPE_DETAIL_SEGMENT[type]
    revalidatePath(`/${segment}/${slug ?? "[slug]"}`)
  }
  for (const path of TYPE_PATHS[type] || []) {
    revalidatePath(path)
  }

  revalidatePath("/sitemap.xml")
  revalidatePath("/feed.xml")

  return NextResponse.json({ revalidated: true, timestamp: Date.now(), type })
}
