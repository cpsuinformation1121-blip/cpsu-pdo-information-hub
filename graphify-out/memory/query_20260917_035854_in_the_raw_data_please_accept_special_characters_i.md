---
type: "query"
date: "2026-09-17T03:58:54.642825+00:00"
question: "in the raw data please accept special characters input please implement that"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminAccomplishResourcePage.tsx", "AdminOpcrPage.tsx", "accomplishmentResourceDataSchema", "opcrResourceDataSchema"]
---

# Q: in the raw data please accept special characters input please implement that

## Answer

Expanded from original query via graph vocabulary: [raw, data, accomplishment, opcr, input, entry, schema, value, admin]. Both AdminAccomplishResourcePage and AdminOpcrPage now apply decimal input mode and numeric validation only to Percentage rows. Raw Data rows use text input and accept punctuation, symbols, accented characters, and Unicode up to the existing 2,000-character server-contract limit. Existing calculation behavior clears an automatically derived total for nonnumeric period values to avoid stale totals; Total remains manually editable. Added accomplishment and OPCR schema tests with special-character Raw Data. TypeScript, lint, 160 tests, and production build pass.

## Outcome

- Signal: useful

## Source Nodes

- AdminAccomplishResourcePage.tsx
- AdminOpcrPage.tsx
- accomplishmentResourceDataSchema
- opcrResourceDataSchema