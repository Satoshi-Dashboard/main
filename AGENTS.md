# Agent Runtime Policy

For OpenCode, Codex, Claude, and any automated coding agent:

1. Before any backend/API task, read `.claude/BACKEND_API_RULES.md`.
2. Treat that file as strict policy for architecture, compatibility, cache, security, and verification.
3. Before any backend/API/data-provider/source-priority task, also read `.claude/DATA_SOURCE_INTEGRITY_RULES.md`.
4. Treat that file as strict policy for approved providers, fallback behavior, refresh cadence, and source-priority integrity.
5. Do not bypass those backend/data-source rules unless the project owner explicitly asks to change them.
6. Before any module registry/order task, read `.claude/MODULE_REGISTRY_RULES.md`.
7. Treat module identity/order rules as strict policy to avoid module numbering confusion.
8. Before any frontend color/UX/UI request, read `.claude/FRONTEND_COLOR_UX_UI_RULES.md`.
9. Treat frontend color semantics (titles, statuses, chart palettes) as strict policy unless the owner explicitly asks to override it.
10. For every frontend module/content/element creation or update, include responsive behavior for mobile and tablet by default.
11. Treat responsive layout and touch usability as mandatory acceptance criteria, not optional enhancements.
12. For every frontend update, preserve responsive typography hierarchy and minimum readable font sizes for mobile/tablet.
13. Treat tiny unreadable text in responsive layouts as a defect that must be corrected before completion.
14. For every new frontend module, follow the mandatory "New module example rules" section in `.claude/FRONTEND_COLOR_UX_UI_RULES.md`.
15. For any new frontend user-facing text, use English by default unless the owner explicitly requests another language.
16. Before any code change (addition, modification, or deletion), verify the planned implementation remains compatible with Vercel deployment.
17. After finishing each code change, re-verify that the project can still be deployed on Vercel without issues.
18. Before any project analysis, audit, or improvement review, first inspect `README.md`, `package.json`, `src/config/modules.js`, and any relevant policy files in `.claude/`; then report findings prioritized by impact, risk, and effort.
