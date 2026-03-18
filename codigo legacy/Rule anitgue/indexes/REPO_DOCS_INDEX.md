---
aliases:
  - Repo Docs Map
  - Markdown Inventory
tags:
  - claude/index
  - claude/repo
  - claude/rag-source
note_type: moc
domain: repo-docs
agent_priority: medium
source_status: canonical-local
---

# Repo Docs Index

## Canonical Docs Inside The Vault

- [[VAULT_HOME]]
- [[RAG_OPERATING_SYSTEM]]
- [[POLICY_INDEX]]
- [[SKILLS_INDEX]]
- [[AGENT_DOCS_INDEX]]
- [[repo/PROJECT_STRUCTURE]]

## Root-Level Docs Outside The Vault

- `README.md` - public project readme for GitHub and contributors; protected from agent edits unless the owner explicitly requests it.
- `patch note.md` - protected user-facing patch notes; do not edit without explicit permission.

## GitHub Docs Outside The Vault

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`

## Governance

- Agentic and operational markdown should live canonically under `.claude/`.
- Public-facing or platform-bound markdown can remain outside `.claude/`, but it should be indexed from this note so it is not lost from the vault map.
- `README.md` is public-facing and protected; agents may read it for context but must not edit it without explicit owner instruction.
