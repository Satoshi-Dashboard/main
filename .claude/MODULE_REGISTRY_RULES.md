# Module Registry Rules (Strict)

These rules apply to any change in:
- `src/config/modules.js`
- module slugs/codes/titles
- module ordering/pagination behavior (`src/pages/ModulePage.jsx`)

## Non-negotiable

1. Do not remove a module entry unless the owner explicitly requests deletion.
2. Do not swap module order unless the owner explicitly requests reordering.
3. Module codes/slugs are auto-generated from list order in `src/config/modules.js`.
4. After any add/remove/reorder, numbering must be contiguous with no gaps:
   - `S01, S02, S03, ... SNN`
   - slugs must follow `sNN-...`
5. If any module order/identity changes, ensure footer/pagination still shows unambiguous module identity.
6. Footer page indicator must reflect module code numbering (derived from `code`/`slug`), not array index.

## Required verification

After changing module registry/order:

1. Run `npm run build`.
2. Confirm navigation works for previous and next controls.
3. Confirm footer shows module identity clearly (`module.code` + position).

## Cross-domain guardrail (mandatory)

Even when changes are not directly editing `src/config/modules.js`, agents must re-check module index mapping before any backend/API or frontend UX work that names modules by number/slug/title.

- Source of truth: `src/config/modules.js` (`MODULE_DEFS`, generated `code`, generated `slug`).
- Never assume module index from chat history in multi-agent sessions.
