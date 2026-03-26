import { useEffect, useState } from 'react';

export function useWindowWidth(defaultWidth = 1280) {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return defaultWidth;
    return window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}
