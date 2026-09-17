---
type: "query"
date: "2026-09-17T07:36:26.741279+00:00"
question: "the forms contents still not showing; excel is the category name, not the file type"
contributor: "graphify"
outcome: "corrected"
correction: "Register excel as a Forms category while keeping the object file type PDF and leaving XLSX uploads disabled."
source_nodes: ["parseResourceObjectKey()", "repositoryStructureStore.ts", "repository.ts"]
---

# Q: the forms contents still not showing; excel is the category name, not the file type

## Answer

Expanded via graph vocabulary: [resource, repository, structure, form, parse, object, key, category, excel]. The screenshot confirms excel is a category slug, not an XLSX file type. Added category id excel to the Forms repository definition and extended the additive migration to add that category to an already-persisted Forms section. The exact forms/excel/2027-2028/MIS DPCR Evaluation Summary.pdf key now parses as a PDF. Upload file definitions remain unchanged and do not allow XLSX.

## Outcome

- Signal: corrected
- Correction: Register excel as a Forms category while keeping the object file type PDF and leaving XLSX uploads disabled.

## Source Nodes

- parseResourceObjectKey()
- repositoryStructureStore.ts
- repository.ts