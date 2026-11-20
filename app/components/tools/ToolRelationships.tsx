import { getProblemsForTool, getToolBySlug } from "@/lib/relationship-data"
import { buildToolRelationships } from "@/lib/tool-relationships"
import type { FallbackLink } from "@/lib/relationship-model"
import ToolRelationshipGroups from "./ToolRelationshipGroups"

interface ToolRelationshipsProps {
  /** Present only for routes backed by a Sanity `tool` document. */
  toolSlug?: string
  /** Static guide map; used only when `toolSlug` is not provided. */
  fallbackGuides?: FallbackLink[] | null
}

export default async function ToolRelationships({ toolSlug, fallbackGuides }: ToolRelationshipsProps) {
  const toolDocument = toolSlug ? await getToolBySlug(toolSlug) : null
  const problems = toolDocument?._id ? await getProblemsForTool(toolDocument._id) : []

  const relationships = buildToolRelationships({
    toolDocument,
    problems,
    // Enforce the WEB-03B rule: static fallback is only for routes without a
    // Sanity tool document. A Sanity-backed route never falls back.
    staticGuides: toolSlug ? null : fallbackGuides,
  })

  return <ToolRelationshipGroups problems={relationships.problems} guides={relationships.guides} />
}
