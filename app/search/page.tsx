import type { Metadata } from "next"
import SearchClient from "./SearchClient"

export const metadata: Metadata = {
  title: "Search",
  description: "Search all AquaMind content — articles, fish species, plants, corals, equipment and more.",
  alternates: { canonical: "https://aquamind.life/search" },
}

export default function SearchPage() {
  return <SearchClient />
}
