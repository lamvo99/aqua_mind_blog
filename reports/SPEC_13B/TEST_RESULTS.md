# SPEC 13B — Test Results

Date: 2026-10-21
Environment: Windows, PowerShell, Node v22.17.0, vitest 4.1.10

## Commands and results

| # | Command | Result |
|---|---|---|
| 1 | `npm run lint` | PASS — eslint exited 0, no findings |
| 2 | `npx tsc --noEmit` | PASS — 0 type errors |
| 3 | `npx vitest run tests/spec13a-plan.test.ts --pool=vmThreads` | PASS — 15/15 |
| 4 | `npx vitest run tests/spec13b-preflight.test.ts --pool=vmThreads` | PASS — 12/12 |
| 5 | `npx vitest run tests/spec13a-plan.test.ts tests/spec13b-preflight.test.ts --pool=vmThreads` | PASS — 2 files, 27/27 |
| 6 | `npx vitest run --pool=vmThreads` | 33 files, 444 tests: 443 pass, 1 fail |

## Known baseline failure (pre-existing, not caused by SPEC 13B)

```
FAIL tests/compare.test.ts > compare config > covers all four database types
AssertionError: expected [ 'coral', 'equipment', …(3) ] to deeply equal [ 'coral', 'equipment', 'plant', …(1) ]
```

`lib/compare.ts` defines five compare domains (includes `invertebrate`) while the test asserts four. Documented since SPEC 12A; intentionally not changed.

## Notes

- `--pool=vmThreads` is required in this environment: the default forks/threads pool intermittently exceeds the hardcoded 60s worker-startup timeout on jsdom `.tsx` files.
- No test or production code was modified to hide an unrelated failure.
- SPEC 13B tests are offline: they validate the generated artifacts (`reports/SPEC_13B/*`), the SPEC 13A plan payloads, and the read-only integrity evidence; they perform no network calls.
