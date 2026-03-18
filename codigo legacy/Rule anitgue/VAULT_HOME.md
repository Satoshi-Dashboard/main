---
aliases:
  - Claude Vault Home
  - Knowledge Vault Home
tags:
  - claude/home
  - claude/rag-source
note_type: moc
domain: vault
agent_priority: critical
source_status: canonical-local
---

# Vault Home

`.claude/` is the shared knowledge vault for Obsidian and the coding agent.

## Start Here

1. [[RAG_OPERATING_SYSTEM]]
2. [[POLICY_INDEX]]
3. [[SKILLS_INDEX]]
4. [[AGENT_DOCS_INDEX]]
5. [[REPO_DOCS_INDEX]]
6. [[KNOWLEDGE_GRAPH]]
7. [[welcome/Bienvenido]]

## Canonical Local Policies

- [[BACKEND_API_RULES]]
- [[DATA_SOURCE_INTEGRITY_RULES]]
- [[MODULE_REGISTRY_RULES]]
- [[FRONTEND_COLOR_UX_UI_RULES]]

## Agentic Canonical Docs

- [[agent-runtime/AGENTS]]
- [[repo/PROJECT_STRUCTURE]]
- [[operations/CLOCK_ALIGNMENT_TODO]]

## Vault Layout

- `indexes/` - graph maps and navigation notes.
- Root `.md` notes - canonical entrypoints and repo policies the agent already expects by path.
- `areas/`, `operations/`, `repo/` - domain maps and operational docs.
- `skills/` - upstream skill packages plus local skill index notes.
- `templates/` - note templates for Obsidian authoring.
- `welcome/` - human-facing onboarding notes.
- `.obsidian/` plus root config files - local vault/tooling state kept at the top level for compatibility.

## Area Maps

- [[areas/Frontend]]
- [[areas/Backend]]
- [[areas/Data]]
- [[areas/Repo]]
- [[areas/Deploy]]

## Upstream Technical Authority

- [[skills/vercel-react-best-practices/SKILL]]
- [[skills/web-design-guidelines/SKILL]]
- [[skills/vercel-composition-patterns/SKILL]]
- [[skills/deploy-to-vercel/SKILL]]

## Shared Retrieval Contract

- Humans navigate by links, folders, graph view, tags, and backlinks.
- The agent starts from this note, then follows `[[RAG_OPERATING_SYSTEM]]` to decide which skill and local policy to read next.
- Agentic markdown should live canonically under `.claude/`; root bridges exist only when the repo or external tooling still expects old paths.
- New operational notes should link back here so nothing becomes orphaned.

## Authoring Rules For New Notes

- Use YAML frontmatter with `tags`, `note_type`, `domain`, `agent_priority`, and `source_status`.
- Link every new note to at least one index note and one related canonical note.
- Keep one topic per note when possible so the vault stays RAG-friendly.
- Do not edit upstream-managed `SKILL.md` files just to improve navigation; wrap them from local index notes instead.
