# SCHEMA_DEPLOYMENT_INTEGRITY_AUDIT

## Date: 2026-09-17
## Branch: main

---

## Issue

Sanity Studio shows these production fields as "Unknown fields":
- `aquariumStyle`
- `isPredator`
- `reefCompatibility`
- `region`

---

## Root Cause

**Stale/deployed Studio (Cause C)**

The Sanity Studio currently deployed to `https://aquamind.life/studio` (or managed hosting) is using an older version of the schema that predates the Phase 2 semantic field additions. The repository schema definitions are correct and complete.

---

## Schema Definition Audit

### Field: `aquariumStyle`

| Schema | Defined | Type | Location |
|--------|---------|------|----------|
| species | ✅ | `array` of `string` | `sanity/schemaTypes/species.ts:82-110` |
| plant | ✅ | `array` of `string` | `sanity/schemaTypes/plant.ts:55-70` |
| coral | ✅ | `array` of `string` | `sanity/schemaTypes/coral.ts:53-67` |
| equipment | ✅ | `array` of `string` | `sanity/schemaTypes/equipment.ts:34-50` |
| invertebrate | ✅ | `array` of `string` | `sanity/schemaTypes/invertebrate.ts:60-75` |

### Field: `isPredator`

| Schema | Defined | Type | Location |
|--------|---------|------|----------|
| species | ✅ | `boolean` | `sanity/schemaTypes/species.ts:131` |

### Field: `reefCompatibility`

| Schema | Defined | Type | Location |
|--------|---------|------|----------|
| species | ✅ | `boolean` | `sanity/schemaTypes/species.ts:132` |
| coral | ✅ | `boolean` | `sanity/schemaTypes/coral.ts:42` |
| invertebrate | ✅ | `boolean` | `sanity/schemaTypes/invertebrate.ts:92` |

### Field: `region`

| Schema | Defined | Type | Location |
|--------|---------|------|----------|
| species | ✅ | `string` with options | `sanity/schemaTypes/species.ts:112-130` |
| plant | ✅ | `string` with options | `sanity/schemaTypes/plant.ts:72-88` |
| invertebrate | ✅ | `string` with options | `sanity/schemaTypes/invertebrate.ts:77-91` |

---

## Schema Registration Audit

| Check | Status |
|-------|--------|
| `sanity/schemaTypes/index.ts` imports all schemas | ✅ PASS |
| `sanity.config.ts` imports `schemaTypes` | ✅ PASS |
| `schema.types` config passes all types | ✅ PASS |
| No duplicate schema definitions | ✅ PASS |
| No legacy schema files | ✅ PASS |

---

## Studio Configuration Audit

| Check | Status |
|-------|--------|
| `sanity.config.ts` uses `defineConfig` | ✅ PASS |
| Schema types imported from `./sanity/schemaTypes` | ✅ PASS |
| No hardcoded schema overrides | ✅ PASS |
| `basePath: '/studio'` | ✅ PASS |

---

## Production Data Impact

| Check | Status |
|-------|--------|
| No entities added | ✅ PASS |
| No entities deleted | ✅ PASS |
| No fields modified | ✅ PASS |
| No data deleted | ✅ PASS |
| DATABASE V1 semantics unchanged | ✅ PASS |

---

## Fix Required

**Sanity Studio redeployment is required.**

The repository schema definitions are correct. The deployed Studio must be redeployed to pick up the current schema.

### Deployment Options

1. **If using Sanity managed hosting:**
   ```bash
   npx sanity deploy
   ```

2. **If embedded in Next.js (self-hosted):**
   - Redeploy the Next.js application
   - The Studio at `/studio` will pick up the current schema

3. **If using CI/CD:**
   - Trigger a new deployment
   - The Studio will rebuild with current schema

---

## Verification

After redeployment, verify in Sanity Studio:
1. Open a `species` document
2. Confirm `aquariumStyle`, `isPredator`, `reefCompatibility`, `region` fields appear
3. Confirm no "Unknown fields" warnings
4. Repeat for `plant`, `coral`, `invertebrate`, `equipment` schemas
