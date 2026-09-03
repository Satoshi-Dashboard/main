# Reporte SEO / GEO / AEO — Satoshi Dashboard

**Fecha**: 2026-07-30
**Rama**: `seo-improvements-v2` → PR [#18](https://github.com/Satoshi-Dashboard/main/pull/18)
**Preview desplegado**: https://satoshidashboard-git-seo-improve-8e2348-luisleonpardos-projects.vercel.app

## Resumen ejecutivo

El sitio ya tenía una base SEO/GEO sorprendentemente madura (robots.txt con allowlist de bots de IA, llm.txt, JSON-LD, scripts de auditoría local, integración GSC vía service account) — no partía de cero. El hallazgo técnico más importante: al ser una SPA 100% client-side sin SSR, cualquier bot que no ejecute JavaScript (varios crawlers de IA incluidos: GPTBot, ClaudeBot, PerplexityBot) veía el título/descripción/canonical/JSON-LD del dashboard raíz en **todas** las rutas — landing, blog, y los 20 módulos activos. Ese hueco ya está cerrado y verificado en producción (preview real, fetch crudo sin JS). También se corrigió un bug real preexistente en `sitemap.xml`/`llm.txt`: 4 módulos activos (incluido el nuevo "BTC Queue") no aparecían indexados.

**Hallazgo crítico de proceso**: el checkout local en el que se empezó a trabajar estaba desincronizado de `origin/main` (~30 commits de diferencia: migración a MapLibre, renumeración de módulos, fixes de seguridad). El trabajo se rehizo completo contra el `main` real antes de abrir el PR — ver tabla de hallazgos abajo.

## Cambios realizados

| Archivo | Qué cambió | Por qué |
|---|---|---|
| `scripts/prerender-seo.js` (nuevo) | Genera un `index.html` estático por cada ruta indexable (landing, blog index, 4 posts, 20 módulos activos) con `<title>`/meta/OG/Twitter/canonical/JSON-LD correctos, leyendo `moduleSEO.js`/`seoContent.js` vía `vite.ssrLoadModule` (no hardcodea contenido). Se ejecuta como postbuild (`npm run build`). | Cerrar el hueco de SSR/GEO — es el fix de mayor impacto de todo el pase. |
| `vercel.json` | Rewrites explícitos para que Vercel sirva cada archivo prerenderizado en vez de caer al shell SPA. | Sin esto, `vercel.json` seguía sirviendo `index.html` raíz para todo. Verificado en el preview real con fetch crudo. |
| `public/sitemap.xml` | Agregados los 4 módulos activos que faltaban (incluido `s06-bitcoin-mempool-queue-v2`, nuevo), corregidos los slugs renumerados, refrescado `lastmod`. | 4 módulos indexables no estaban en el sitemap — bug real, no solo staleness. |
| `public/llm.txt` | Misma corrección de módulos faltantes/renumerados; fecha actualizada. | Igual gap que el sitemap. |
| `public/llms.txt` (nuevo) | Archivo con el nombre correcto según el spec de llms.txt (el existente `llm.txt` se mantiene). | El usuario pidió explícitamente crear `llms.txt` si no existía — no existía con ese nombre exacto. |
| `index.html`, `moduleSEO.js`, `seoContent.js` | 3 títulos recortados (71→56, 62→54, 61→60 caracteres) — violaban la propia regla de `seo-audit-local.js` (≤60 caracteres). | Quick win directo, detectado por el script de auditoría ya existente en el repo. |
| `seoContent.js` | 2 frases nuevas por post de blog (8 en total), citando fuentes reales (mempool.space, Bitnodes, Alternative.me) con datos evergreen (no precios/cifras que caducan). | El contenido de blog era prosa genérica sin datos citables — bajo valor para AEO. Generado por 4 agentes en paralelo, aplicado manualmente tras revisión. |
| `S11_StablecoinPegHealth.jsx` | `alt={symbol}` → `alt="${symbol} logo"` | Alt text más descriptivo (único hallazgo real de accesibilidad de imagen — el resto de la app renderiza gráficos vía SVG/canvas, no `<img>`). |
| `package.json` | Agregados scripts `seo:audit` / `seo:fix` para los scripts ya existentes pero nunca expuestos por npm. | Estaban construidos pero solo invocables con `node scripts/...` directo. |

**Verificación realizada**: `npm run build` (26 rutas prerenderizadas) + `npm run lint` (limpio — los 404 errores que aparecían venían de `.logs/chrome-cdp-capture/` local, no rastreado por git, no relacionado) + `node scripts/seo-audit-local.js` (50/51 checks, 0 errores, 1 warning no accionable) + fetch crudo contra el preview real de Vercel confirmando título/canonical correctos por ruta, incluida la ruta nueva (`s06-bitcoin-mempool-queue-v2`) y una ruta renumerada (`s07-bitcoin-nodes-world-map`), y confirmando que los módulos `noindex` (en construcción) siguen cayendo correctamente al shell SPA.

## Hallazgos que no se resolvieron y por qué

| Hallazgo | Por qué no se resolvió | Qué se necesita |
|---|---|---|
| **Google Search Console no está configurado realmente** | `scripts/gsc-inspect.js` y `gsc-sitemap.js` existen y están bien construidos, pero `GOOGLE_SERVICE_ACCOUNT_KEY` no está seteado ni localmente ni como secret de GitHub Actions (`gh secret list` devolvió vacío). Los workflows `deploy-seo.yml` y `seo-monitor.yml` llevan fallando desde julio (confirmado con `gh run list`). No existe conector MCP de Search Console en este entorno, y crear la service account + verificar la propiedad en GSC requiere login de Google del usuario — acción que no puedo ejecutar. | Crear una service account en Google Cloud Console con acceso de lectura/escritura a la propiedad `satoshidashboard.com` en Search Console (la propiedad ya debería estar verificada si esos scripts se escribieron con esa intención), y cargar `GOOGLE_SERVICE_ACCOUNT_KEY` + `GOOGLE_SITE_URL` como secrets en GitHub Actions. Una vez cargado, los workflows existentes deberían funcionar sin más cambios de código. |
| **PageSpeed Insights** | Mismo problema: `PAGESPEED_API_KEY` no está seteado. `lhci-reports/` solo tiene registros de error 429 (quota excedida) de marzo. | Generar una API key de PageSpeed Insights y cargarla como secret/env var. |
| **El checkout local estaba ~30 commits detrás de `origin/main`** | Descubierto a mitad de la ejecución (migración MapLibre, renumeración de módulos S06+, fixes de seguridad ya en main). Se abortó el primer intento de push a `main` (rechazado correctamente por git, sin pérdida de datos) y se rehizo todo el trabajo con `git cherry-pick` contra el `main` real antes de abrir el PR. Existe una rama sobrante `seo-improvements` en el remoto, basada en el historial viejo/incorrecto — **no la borré** (requiere confirmación explícita para acciones destructivas de git). | Correr `git push origin --delete seo-improvements` si estás de acuerdo, o decírmelo y lo hago. No afecta nada — nunca se abrió PR desde ella. |
| **`npm install` trajo 14 vulnerabilidades "high" localmente** (vs. 2 que reporta GitHub Dependabot sobre el branch por defecto) | No investigué la causa de la discrepancia ni corrí `npm audit fix` — cambiar versiones de dependencias es una acción que requiere tu confirmación explícita, y no es parte del alcance SEO. | Correr `npm audit` para ver el detalle y decidir si aplica `npm audit fix` (sin `--force`, que puede introducir breaking changes). |
| **Vercel CLI creó un proyecto vacío llamado "satoshi-dashboard"** (sin guion en el nombre real: "satoshidashboard") como efecto secundario de un intento fallido de `vercel dev --yes` mientras diagnosticaba el link roto de `.vercel/project.json` | Fue un efecto colateral no intencional de mi diagnóstico, no de tu proyecto. No lo borré (acción destructiva de cuenta). | Si quieres, borra el proyecto vacío desde el dashboard de Vercel (`luisleonpardos-projects/satoshi-dashboard`, actualizado hace unos minutos, sin deploys reales). |
| **Imagen OG/Twitter compartida en todas las rutas** (`foto-metadata.png`) | Generar imágenes OG diferenciadas por módulo/post es trabajo de diseño, fuera de alcance de un pase de código. | Si se prioriza, sería un módulo aparte (posiblemente generación programática con `@vercel/og` o similar). |

## Próximos pasos recomendados

**Quick wins pendientes** (bajo esfuerzo, alto impacto):
1. Cargar los secrets de GSC/PageSpeed en GitHub Actions (ver tabla arriba) — desbloquea automatización ya construida.
2. Confirmar que la propiedad `satoshidashboard.com` sigue verificada en Search Console (login manual, 2 minutos).
3. Revisar y mergear el [PR #18](https://github.com/Satoshi-Dashboard/main/pull/18) tras un vistazo rápido al preview.

**Inversión a mediano plazo**:
1. Generar imágenes OG/Twitter diferenciadas por módulo/post (mejora CTR en compartidos sociales y previews de IA).
2. Ampliar contenido de blog más allá de las 2 frases citables agregadas — considerar 1-2 posts nuevos apuntando a long-tail queries que ya están mapeadas en `SEO_KEYWORD_ROWS`/`SEO_QUESTION_ROWS` de `SeoLandingPage.jsx` pero sin post dedicado.
3. Investigar y resolver las vulnerabilidades npm reportadas (14 local / 2 en GitHub).
4. Considerar HowTo schema para los posts de tipo guía (`bitcoin-nodes-map-monitor`, `bitcoin-point-of-sale-dashboard`) además del FAQ/BlogPosting/Breadcrumb ya presente.

---
*Generado de forma autónoma por Claude Code. Todo el trabajo de código vive en la rama `seo-improvements-v2`; nada se mergeó a `main` sin tu revisión.*
