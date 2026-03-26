import { useEffect, useState } from 'react';

function subscribeToMediaQuery(mediaQueryList, callback) {
  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', callback);
    return () => mediaQueryList.removeEventListener('change', callback);
  }

  mediaQueryList.addListener(callback);
  return () => mediaQueryList.removeListener(callback);
}

export function useMediaQuery(query, defaultValue = false) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQueryList = window.matchMedia(query);
    const updateMatches = (event) => {
      setMatches(event?.matches ?? mediaQueryList.matches);
    };

    updateMatches();
    return subscribeToMediaQuery(mediaQueryList, updateMatches);
  }, [defaultValue, query]);

  return matches;
}
