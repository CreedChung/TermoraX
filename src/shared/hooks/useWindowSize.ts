import { useState, useEffect, useCallback } from "react";

/**
 * Window size state interface
 */
export interface WindowSize {
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
}

/**
 * Hook to track and respond to window size changes
 *
 * Returns the current window dimensions with SSR-safe defaults (0, 0).
 * Automatically updates when the window is resized with debounced handling.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { width, height } = useWindowSize();
 *   return <div>Window: {width} x {height}</div>;
 * }
 * ```
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Set initial size
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return windowSize;
}

/**
 * Hook to check if current window width is below a threshold
 *
 * @param threshold - Width threshold in pixels (default: 768)
 * @returns true if window width is less than threshold
 *
 * @example
 * ```tsx
 * function ResponsiveLayout() {
 *   const isCompact = useIsCompact(1024);
 *   return isCompact ? <MobileView /> : <DesktopView />;
 * }
 * ```
 */
export function useIsCompact(threshold: number = 768): boolean {
  const { width } = useWindowSize();
  return width > 0 && width < threshold;
}

/**
 * Hook to check if current window width is above a threshold
 *
 * @param threshold - Width threshold in pixels (default: 1024)
 * @returns true if window width is greater than or equal to threshold
 *
 * @example
 * ```tsx
 * function ResponsiveLayout() {
 *   const isWide = useIsWide(1280);
 *   return isWide ? <SidePanel /> : null;
 * }
 * ```
 */
export function useIsWide(threshold: number = 1024): boolean {
  const { width } = useWindowSize();
  return width >= threshold;
}
