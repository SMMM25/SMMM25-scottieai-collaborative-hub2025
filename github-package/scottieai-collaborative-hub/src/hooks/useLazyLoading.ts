import { useEffect, useState, useRef } from 'react';

type IntersectionOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
};

/**
 * Custom hook for lazy loading components when they enter the viewport
 * @param options IntersectionObserver options
 */
export function useIntersectionObserver(options: IntersectionOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<Element | null>(null);

  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, mergedOptions);

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [mergedOptions.root, mergedOptions.rootMargin, mergedOptions.threshold, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
}

/**
 * Custom hook for lazy loading images
 * @param src Image source URL
 * @param options IntersectionObserver options
 */
export function useLazyImage(src: string, options: IntersectionOptions = {}) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    if (!imageRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setImageSrc(src);
        observer.unobserve(imageRef);
      }
    }, mergedOptions);

    observer.observe(imageRef);

    return () => {
      if (imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src, mergedOptions.root, mergedOptions.rootMargin, mergedOptions.threshold]);

  const onLoad = () => {
    setIsLoaded(true);
  };

  const onError = () => {
    setIsError(true);
  };

  return {
    ref: setImageRef,
    imageSrc,
    isLoaded,
    isError,
    onLoad,
    onError,
  };
}

/**
 * Custom hook for lazy loading components
 * @param options IntersectionObserver options
 */
export function useLazyComponent<T>(
  component: React.ComponentType<T>,
  options: IntersectionOptions = {}
) {
  const { ref, isIntersecting, hasIntersected } = useIntersectionObserver(options);
  const [LazyComponent, setLazyComponent] = useState<React.ComponentType<T> | null>(null);

  useEffect(() => {
    if (hasIntersected && !LazyComponent) {
      setLazyComponent(() => component);
    }
  }, [hasIntersected, component, LazyComponent]);

  return { ref, LazyComponent, isVisible: isIntersecting };
}
