---
aliases:
  - RAG OS
  - Retrieval Operating System
tags:
  - claude/rag
  - claude/rag-source
  - claude/home
note_type: playbook
domain: retrieval
agent_priority: critical
source_status: canonical-local
---

# RAG Operating System

This note defines how the vault is consumed by both Obsidian users and the agent.

## Retrieval Order

1. Start from [[VAULT_HOME]].
2. Classify the task: `frontend`, `backend`, `data-source`, `module-registry`, `deploy`, `agent-runtime`, `repo-docs`, or `general`.
3. Read the matching upstream skill from [[SKILLS_INDEX]] first when technical guidance is needed.
4. Read the matching local policy from [[POLICY_INDEX]] for repo-specific constraints.
5. For runtime, TODO, and structural guidance, route through [[AGENT_DOCS_INDEX]] or [[REPO_DOCS_INDEX]].
6. Follow backlinks and related notes before making changes if the topic spans multiple domains.

## Task Routing

- `frontend` -> [[FRONTEND_COLOR_UX_UI_RULES]] + [[skills/VERCEL_REACT_BEST_PRACTICES_INDEX]] + [[skills/WEB_DESIGN_GUIDELINES_INDEX]] + [[skills/DESIGN_SKILLS_INDEX]]
- `backend` -> [[BACKEND_API_RULES]] + [[skills/VERCEL_REACT_BEST_PRACTICES_INDEX]]
- `data-source` -> [[DATA_SOURCE_INTEGRITY_RULES]] + [[BACKEND_API_RULES]]
- `module-registry` -> [[MODULE_REGISTRY_RULES]]
- `component-api` -> [[skills/VERCEL_COMPOSITION_PATTERNS_INDEX]]
- `deploy` -> [[skills/DEPLOY_TO_VERCEL_INDEX]]
- `agent-runtime` -> [[AGENT_DOCS_INDEX]] + [[agent-runtime/AGENTS]]
- `repo-docs` -> [[REPO_DOCS_INDEX]] + [[repo/PROJECT_STRUCTURE]]
- `github-workflow` -> [[skills/GITHUB_WORKFLOW_SKILLS_INDEX]]

## Minimum Metadata For New Notes

```yaml
---
tags:
  - claude/<domain>
note_type: <policy|playbook|reference|log|welcome|moc>
domain: <topic>
agent_priority: <low|medium|high|critical>
source_status: <canonical-local|working-note|reference-only>
---
```

## Anti-Loss Rules

- Every important note must be linked from at least one index note.
- Every canonical note must carry `claude/rag-source`.
- Avoid standalone files with no backlinks.
- Preserve original file paths for repo policies the agent already expects.
