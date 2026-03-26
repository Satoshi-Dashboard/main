---
aliases:
  - Agent Satoshi Welcome
  - Bienvenida Agent Satoshi
tags:
  - claude/home
  - claude/agent
  - claude/rag-source
note_type: welcome
domain: agent
agent_priority: medium
source_status: working-note
---

# Bienvenido

Esta carpeta `.claude/` ahora funciona como la boveda compartida entre Obsidian y el agente.

## Empiece aqui

- [[VAULT_HOME]]
- [[RAG_OPERATING_SYSTEM]]
- [[POLICY_INDEX]]
- [[SKILLS_INDEX]]
- [[AGENT_DOCS_INDEX]]
- [[REPO_DOCS_INDEX]]
- [[KNOWLEDGE_GRAPH]]

## Uso recomendado

1. Capture nuevas ideas o reglas en notas atomicas enlazadas desde `[[VAULT_HOME]]`.
2. Mantenga las restricciones del proyecto en las politicas canonicas de la raiz de `.claude/`.
3. Use el grafo de Obsidian para seguir backlinks y no perder contexto entre features, reglas y skills.
4. Cuando cree nuevas notas operativas, parta de `[[templates/Knowledge Note Template]]`.

## Estructura rapida del vault

- `indexes/` agrupa mapas de navegacion y vistas globales.
- La raiz de `.claude/` conserva las notas canonicas que el agente espera por ruta fija.
- `skills/` concentra skills upstream y sus indices locales.
- `templates/` guarda plantillas reutilizables para nuevas notas.
- `welcome/` queda para notas de entrada humana.
- `.obsidian/` y los archivos de configuracion del root se mantienen arriba por compatibilidad de tooling.

## Nota

Los `SKILL.md` dentro de `skills/` siguen siendo gestionados por tooling upstream; el vault los envuelve con indices y enlaces sin romper su mantenimiento externo.
