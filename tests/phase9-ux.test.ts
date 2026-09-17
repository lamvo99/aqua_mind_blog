import { describe, it, expect } from "vitest"

describe("phase 9 — database UX & discovery", () => {
  describe("database hub", () => {
    it("exposes all entity categories in navigation", async () => {
      const { databaseCategories } = await import("@/lib/navigation")
      const labels = databaseCategories.map((c) => c.label)
      expect(labels).toContain("Fish")
      expect(labels).toContain("Invertebrates")
      expect(labels).toContain("Plants")
      expect(labels).toContain("Corals")
      expect(labels).toContain("Equipment")
      expect(labels).toContain("Problems")
    })

    it("databaseNav includes Problems, Inspiration, Finder", async () => {
      const { databaseNav } = await import("@/lib/navigation")
      const hrefs = databaseNav.map((n) => n.href)
      expect(hrefs).toContain("/problems")
      expect(hrefs).toContain("/inspiration")
      expect(hrefs).toContain("/finder")
    })

    it("each category has a count", async () => {
      const { databaseCategories } = await import("@/lib/navigation")
      for (const cat of databaseCategories) {
        expect(cat.count).toBeGreaterThan(0)
      }
    })
  })

  describe("listing pages", () => {
    it("species page file exists with expected exports", async () => {
      const fs = await import("fs")
      const path = await import("path")
      const content = fs.readFileSync(path.resolve("app/species/page.tsx"), "utf8")
      expect(content).toContain("export const metadata")
      expect(content).toContain("export const revalidate")
      expect(content).toContain("DatabaseGrid")
      expect(content).toContain("finderHref")
    })

    it("plants page file exists with expected exports", async () => {
      const fs = await import("fs")
      const path = await import("path")
      const content = fs.readFileSync(path.resolve("app/plants/page.tsx"), "utf8")
      expect(content).toContain("export const metadata")
      expect(content).toContain("DatabaseGrid")
      expect(content).toContain("finderHref")
    })

    it("corals page file exists with expected exports", async () => {
      const fs = await import("fs")
      const path = await import("path")
      const content = fs.readFileSync(path.resolve("app/corals/page.tsx"), "utf8")
      expect(content).toContain("export const metadata")
      expect(content).toContain("DatabaseGrid")
      expect(content).toContain("finderHref")
    })

    it("equipment page file exists with expected exports", async () => {
      const fs = await import("fs")
      const path = await import("path")
      const content = fs.readFileSync(path.resolve("app/equipment/page.tsx"), "utf8")
      expect(content).toContain("export const metadata")
      expect(content).toContain("DatabaseGrid")
      expect(content).toContain("finderHref")
    })

    it("invertebrates page file exists with expected exports", async () => {
      const fs = await import("fs")
      const path = await import("path")
      const content = fs.readFileSync(path.resolve("app/invertebrates/page.tsx"), "utf8")
      expect(content).toContain("export const metadata")
      expect(content).toContain("DatabaseGrid")
      expect(content).toContain("finderHref")
    })
  })

  describe("DatabaseGrid component", () => {
    it("has expected props interface and exports", async () => {
      const fs = await import("fs")
      const path = await import("path")
      const content = fs.readFileSync(path.resolve("app/components/database/DatabaseGrid.tsx"), "utf8")
      expect(content).toContain("FilterGroup")
      expect(content).toContain("RangeFilter")
      expect(content).toContain("finderHref")
      expect(content).toContain("filtersOpen")
    })
  })

  describe("DatabaseCard component", () => {
    it("has expected accessibility attributes", async () => {
      const fs = await import("fs")
      const path = await import("path")
      const content = fs.readFileSync(path.resolve("app/components/database/DatabaseCard.tsx"), "utf8")
      expect(content).toContain("aria-label")
      expect(content).toContain("focus-visible")
      expect(content).toContain("getDifficultyColor")
    })
  })

  describe("RelationshipSection component", () => {
    it("has expected props", async () => {
      const fs = await import("fs")
      const path = await import("path")
      const content = fs.readFileSync(path.resolve("app/components/database/RelationshipSection.tsx"), "utf8")
      expect(content).toContain("emptyMessage")
      expect(content).toContain("maxVisible")
    })
  })

  describe("navigation consistency", () => {
    it("mainNav contains Database link", async () => {
      const { mainNav } = await import("@/lib/navigation")
      const hrefs = mainNav.map((n) => n.href)
      expect(hrefs).toContain("/database")
    })

    it("all databaseNav hrefs are valid routes", async () => {
      const { databaseNav } = await import("@/lib/navigation")
      const validPrefixes = ["/wiki", "/species", "/invertebrates", "/plants", "/corals", "/equipment", "/problems", "/inspiration", "/finder"]
      for (const item of databaseNav) {
        const isValid = validPrefixes.some((p) => item.href.startsWith(p))
        expect(isValid).toBe(true)
      }
    })
  })

  describe("URL state", () => {
    it("compare config has all 5 types", async () => {
      const { COMPARE_FIELDS } = await import("@/lib/compare")
      const types = Object.keys(COMPARE_FIELDS).sort()
      expect(types).toEqual(["coral", "equipment", "invertebrate", "plant", "species"])
    })
  })
})
