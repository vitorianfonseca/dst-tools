import { useRef, useState, useCallback, useMemo } from "react";

export interface ImageCache {
  getImage: (src: string) => HTMLImageElement | null;
  preloadImages: (srcs: string[]) => void;
}

export function useImageCache(): ImageCache {
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const loadingRef = useRef<Set<string>>(new Set());
  const [, setVersion] = useState(0);

  const getImage = useCallback((src: string): HTMLImageElement | null => {
    if (!src) return null;

    const cached = cacheRef.current.get(src);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      return cached;
    }

    if (!loadingRef.current.has(src)) {
      loadingRef.current.add(src);
      const img = new Image();
      img.src = src;
      img.onload = () => {
        cacheRef.current.set(src, img);
        setVersion((v) => v + 1);
      };
      cacheRef.current.set(src, img);
    }

    return null;
  }, []);

  const preloadImages = useCallback((srcs: string[]) => {
    for (const src of srcs) {
      if (src && !cacheRef.current.has(src)) {
        getImage(src);
      }
    }
  }, [getImage]);

  return useMemo(() => ({ getImage, preloadImages }), [getImage, preloadImages]);
}
