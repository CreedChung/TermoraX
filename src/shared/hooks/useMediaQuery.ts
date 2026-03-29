import { useState, useEffect, useCallback } from "react";

/**
 * Hook to listen to CSS media queries
 *
 * Returns a boolean indicating whether the media query currently matches.
 * Automatically updates when the media query state changes.
 *
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean - true if the media query matches
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
 *   const isPortrait = useMediaQuery("(orientation: portrait)");
 *
 *   return (
 *     <div className={isDarkMode ? "dark" : "light"}>
 *       {isPortrait ? "Portrait mode" : "Landscape mode"}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  const handleChange = useCallback((event: MediaQueryListEvent) => {
    setMatches(event.matches);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Add listener (with fallback for older browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Safari < 14 fallback
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // Safari < 14 fallback
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query, handleChange]);

  return matches;
}

/**
 * Hook to detect if user prefers reduced motion
 *
 * Useful for accessibility - disable animations when user prefers reduced motion.
 *
 * @returns boolean - true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function AnimatedPanel() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={prefersReducedMotion ? {} : { opacity: 1 }}
 *       transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
 *     />
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Hook to detect if user prefers dark color scheme
 *
 * @returns boolean - true if user prefers dark color scheme
 *
 * @example
 * ```tsx
 * function ThemeAwareComponent() {
 *   const prefersDark = usePrefersDarkMode();
 *   return <div className={prefersDark ? "dark-theme" : "light-theme"}>Content</div>;
 * }
 * ```
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

/**
 * Hook to detect if device supports hover (has fine pointer)
 *
 * Useful for adapting UI for touch vs mouse interaction.
 *
 * @returns boolean - true if device supports hover (mouse/touchpad)
 *
 * @example
 * ```tsx
 * function InteractiveElement() {
 *   const canHover = useCanHover();
 *
 *   return (
 *     <button
 *       className={canHover ? "hover-effects" : "touch-optimized"}
 *       onClick={handleClick}
 *     >
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useCanHover(): boolean {
  return useMediaQuery("(hover: hover)");
}

/**
 * Hook to detect touch device capabilities
 *
 * @returns boolean - true if device is a coarse pointer device (touch)
 *
 * @example
 * ```tsx
 * function TouchOptimizedList() {
 *   const isTouchDevice = useIsTouchDevice();
 *
 *   return (
 *     <ul className={isTouchDevice ? "touch-scroll" : "normal-scroll"}>
 *       {items.map(item => <li key={item.id}>{item.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
