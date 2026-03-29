/**
 * Module Registry - Main Entry Point
 *
 * This module provides the central registry of all modules.
 * Modules are now discovered from structured folders with:
 * - module.json (metadata)
 * - SKILL.md (AI documentation)
 * - index.jsx (component)
 * - references/ (detailed docs)
 *
 * See moduleRegistry.js for the discovery and loading logic.
 */

import { getModules, MODULES as _MODULES } from '@/features/module-registry/moduleRegistry.js';
import { buildLegacyModuleRedirects } from '@/features/module-registry/legacyModuleRedirects.js';

/**
 * MODULES: The main module registry
 *
 * This is populated by moduleRegistry.js during app initialization.
 * Will be null until modules are discovered and loaded.
 *
 * Access:
 * - Synchronous: MODULES (after initialization)
 * - Asynchronous: getModules() (always works)
 */
export let MODULES = null;

// Initialize modules on first access
let initPromise = null;

async function initializeModules() {
  if (MODULES) return MODULES;

  if (!initPromise) {
    initPromise = getModules().then(modules => {
      MODULES = modules;
      assertModuleRegistry(MODULES);
      return modules;
    });
  }

  return initPromise;
}

// Start initialization immediately
initializeModules().catch(err => {
  console.error('❌ Failed to initialize modules:', err);
});

/**
 * Validate module registry structure and integrity
 */
function assertModuleRegistry(modules) {
  if (!Array.isArray(modules) || modules.length === 0) {
    throw new Error('Invalid module registry: expected non-empty array');
  }

  const seenCodes = new Set();
  const seenSlugs = new Set();

  modules.forEach((module, index) => {
    const code = String(module.code || '');
    const slug = String(module.slug || '');
    const expectedCode = `S${String(index + 1).padStart(2, '0')}`;
    const expectedPrefix = `${expectedCode.toLowerCase()}-`;

    if (seenCodes.has(code)) {
      throw new Error(`Duplicate module code detected: ${code}`);
    }
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate module slug detected: ${slug}`);
    }
    if (code !== expectedCode) {
      throw new Error(`Module code sequence mismatch: expected ${expectedCode}, got ${code}`);
    }
    if (!slug.startsWith(expectedPrefix)) {
      throw new Error(`Module slug must start with ${expectedPrefix}: ${slug}`);
    }

    seenCodes.add(code);
    seenSlugs.add(slug);
  });
}

/**
 * Derived module lookups (populated after initialization)
 */
export let FIRST_MODULE = null;
export let MODULES_BY_SLUG = {};
export let MODULES_BY_CODE = {};

// Update lookups when modules are initialized
initializeModules().then(modules => {
  FIRST_MODULE = modules[0];
  MODULES_BY_SLUG = Object.fromEntries(modules.map((module) => [module.slug, module]));
  MODULES_BY_CODE = Object.fromEntries(modules.map((module) => [module.code, module]));
});

/**
 * Legacy module redirects for backward compatibility
 */
export let LEGACY_MODULE_REDIRECTS = {};

initializeModules().then(modules => {
  LEGACY_MODULE_REDIRECTS = buildLegacyModuleRedirects(modules);
});

/**
 * Get the path for a module
 * @param {Module|string} moduleOrCode - Module object or code (e.g., "S01")
 * @returns {string} Path to the module (e.g., "/" or "/module/s01-bitcoin-overview")
 */
export function getModulePath(moduleOrCode) {
  if (!MODULES || MODULES.length === 0) {
    return '/';
  }

  const module = typeof moduleOrCode === 'string' ? MODULES_BY_CODE[moduleOrCode] : moduleOrCode;
  if (!module) return '/';
  return module.code === FIRST_MODULE.code ? '/' : `/module/${module.slug}`;
}

/**
 * Preload a module's component for faster loading
 * @param {Module|string} moduleOrSlugOrCode - Module, slug, or code
 * @returns {Promise} Preload promise
 */
export function preloadModule(moduleOrSlugOrCode) {
  const module = typeof moduleOrSlugOrCode === 'string'
    ? MODULES_BY_SLUG[moduleOrSlugOrCode] || MODULES_BY_CODE[moduleOrSlugOrCode]
    : moduleOrSlugOrCode;
  return module?.component?.preload?.() ?? Promise.resolve();
}

/**
 * Ensure modules are initialized before using
 * Useful in components that need MODULES to be available
 */
export function ensureModulesLoaded() {
  return initializeModules();
}

/**
 * Get modules asynchronously (recommended)
 */
export { getModules };
