import {
  selectProblemsForTool,
  selectToolGuides,
} from './relationship-model'
import { readSlug } from './relationships'
import type {
  EntityTarget,
  FallbackLink,
  RawPost,
  RawProblem,
  RawTool,
  ToolGuideTarget,
} from './relationship-model'

/**
 * WEB-03F Tool relationships.
 *
 * Sources of truth:
 * - Tool → Problem: `problem.relatedTools` reverse references.
 * - Tool → Guide: `tool.relatedPosts` for Sanity-backed tools; the static
 *   `TOOL_LEARN_LINKS` map only for routes without a Sanity tool document.
 */

export const TOOL_RELATIONSHIP_LIMITS = {
  problems: 5,
  guides: 3,
} as const

export interface ToolDocumentLike extends RawTool {
  relatedPosts?: RawPost[] | null
}

export interface ToolRelationshipInputs {
  toolDocument?: ToolDocumentLike | null
  problems?: RawProblem[] | null
  /** Static guide map; only used when no Sanity tool document exists. */
  staticGuides?: FallbackLink[] | null
}

export interface ToolRelationshipBlocks {
  problems: EntityTarget[]
  guides: ToolGuideTarget[]
}

export function buildToolRelationships(
  input: ToolRelationshipInputs
): ToolRelationshipBlocks {
  const toolDocument = input.toolDocument ?? null

  // A Sanity-backed tool always resolves guides explicitly; an empty explicit
  // list must NOT fall back to the static map.
  const guides = selectToolGuides({
    explicit: toolDocument?.relatedPosts,
    fallback: toolDocument ? [] : input.staticGuides,
    limit: TOOL_RELATIONSHIP_LIMITS.guides,
  })

  const problems = selectProblemsForTool(
    input.problems,
    readSlug(toolDocument?.slug),
    TOOL_RELATIONSHIP_LIMITS.problems
  )

  const seen = new Set<string>()
  const take = <T extends { href: string }>(items: T[]): T[] =>
    items.filter((item) => {
      if (seen.has(item.href)) return false
      seen.add(item.href)
      return true
    })

  return {
    problems: take(problems),
    guides: take(guides),
  }
}
