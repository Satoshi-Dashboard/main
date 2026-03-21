let analyticsModulePromise = null;

function loadAnalyticsModule() {
  if (!analyticsModulePromise) {
    analyticsModulePromise = import('@vercel/analytics').catch(() => null);
  }
  return analyticsModulePromise;
}

function shouldDedupe(dedupeKey, dedupeMs) {
  if (!dedupeKey || typeof window === 'undefined') return false;

  try {
    const storageKey = `va:${dedupeKey}`;
    const now = Date.now();
    const lastTrackedAt = Number(window.sessionStorage.getItem(storageKey) || 0);

    if (lastTrackedAt > 0 && now - lastTrackedAt < dedupeMs) {
      return true;
    }

    window.sessionStorage.setItem(storageKey, String(now));
  } catch {
    return false;
  }

  return false;
}

export function trackEvent(name, properties = {}, options = {}) {
  if (typeof window === 'undefined') return;

  const {
    dedupeKey = null,
    dedupeMs = 1200,
  } = options;

  if (shouldDedupe(dedupeKey, dedupeMs)) return;

  loadAnalyticsModule()
    .then((module) => module?.track?.(name, properties))
    .catch(() => {
      // Keep analytics failures from affecting product UX.
    });
}

function getModulePayload(module) {
  return {
    moduleCode: module?.code || null,
    moduleSlug: module?.slug || null,
    moduleTitle: module?.title || null,
  };
}

export function trackModuleViewed(module, properties = {}) {
  const path = properties.path || module?.path || module?.canonicalPath || 'unknown';

  trackEvent(
    'Module Viewed',
    {
      ...getModulePayload(module),
      ...properties,
    },
    { dedupeKey: `module-view:${path}` },
  );
}

export function trackModuleNavigation({ action, surface, currentModule, targetModule }) {
  trackEvent('Module Navigation Clicked', {
    action: action || 'open',
    surface: surface || 'unknown',
    ...getModulePayload(currentModule),
    targetCode: targetModule?.code || null,
    targetSlug: targetModule?.slug || null,
    targetTitle: targetModule?.title || null,
  });
}

export function trackLandingViewed(properties = {}) {
  const path = properties.path || '/landingpage';

  trackEvent(
    'Landing Page Viewed',
    {
      path,
      ...properties,
    },
    { dedupeKey: `landing-view:${path}` },
  );
}

export function trackSeoNavigationClick({ label, destination, surface }) {
  trackEvent('SEO Navigation Clicked', {
    label: label || null,
    destination: destination || null,
    surface: surface || 'unknown',
  });
}

export function trackLandingCtaClick({ label, destination, section }) {
  trackEvent('Landing CTA Clicked', {
    label: label || null,
    destination: destination || null,
    section: section || 'landing',
  });
}
