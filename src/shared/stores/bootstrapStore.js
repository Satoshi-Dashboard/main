/**
 * Bootstrap store — singleton that fetches /api/bootstrap once on app load
 * and provides cached module data for instant hydration.
 *
 * No external dependencies. React components read from this via getModuleData().
 */

let _snapshot = null;
let _hydratePromise = null;
let _isHydrated = false;

/**
 * Kicks off a single fetch to /api/bootstrap.
 * Safe to call multiple times — only the first call triggers a fetch.
 */
export function hydrate() {
  if (_hydratePromise) return _hydratePromise;

  _hydratePromise = fetch('/api/bootstrap')
    .then((res) => {
      if (!res.ok) throw new Error(`bootstrap ${res.status}`);
      return res.json();
    })
    .then((data) => {
      _snapshot = data.modules || {};
      _isHydrated = true;
    })
    .catch(() => {
      _snapshot = {};
      _isHydrated = true;
    });

  return _hydratePromise;
}

/**
 * Returns the cached data for a given bootstrap registry key, or null.
 * After the first live API response replaces it, this can still be called
 * safely — it returns whatever was in the bootstrap snapshot.
 */
export function getModuleData(registryKey) {
  if (!_snapshot) return null;
  return _snapshot[registryKey] ?? null;
}

/**
 * True once the bootstrap fetch has completed (success or failure).
 */
export function isHydrated() {
  return _isHydrated;
}
