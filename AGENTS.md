# Agent Runtime Policy

For OpenCode, Codex, Claude, and any automated coding agent:

1. Before any backend/API task, read `.claude/BACKEND_API_RULES.md`.
2. Treat that file as strict policy for architecture, compatibility, cache, security, and verification.
3. Do not bypass those rules unless the project owner explicitly asks to change them.
4. Before any module registry/order task, read `.claude/MODULE_REGISTRY_RULES.md`.
5. Treat module identity/order rules as strict policy to avoid module numbering confusion.
6. Before any frontend color/UX/UI request, read `.claude/FRONTEND_COLOR_UX_UI_RULES.md`.
7. Treat frontend color semantics (titles, statuses, chart palettes) as strict policy unless the owner explicitly asks to override it.
8. For every frontend module/content/element creation or update, include responsive behavior for mobile and tablet by default.
9. Treat responsive layout and touch usability as mandatory acceptance criteria, not optional enhancements.
10. For every frontend update, preserve responsive typography hierarchy and minimum readable font sizes for mobile/tablet.
11. Treat tiny unreadable text in responsive layouts as a defect that must be corrected before completion.
12. For every new frontend module, follow the mandatory "New module example rules" section in `.claude/FRONTEND_COLOR_UX_UI_RULES.md`.
