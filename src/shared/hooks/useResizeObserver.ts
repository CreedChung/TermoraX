import { useState, useEffect, useRef, RefObject } from "react";

/**
 * Element size state interface
 */
export interface ElementSize {
  /** Element width in pixels */
  width: number;
  /** Element height in pixels */
  height: number;
}

/**
 * Options for useResizeObserver hook
 */
export interface UseResizeObserverOptions {
  /** Initial width before first observation */
  initialWidth?: number;
  /** Initial height before first observation */
  initialHeight?: number;
  /** Enable console logging for debugging */
  debug?: boolean;
}

/**
 * Hook to observe element size changes using ResizeObserver API
 *
 * Returns the current dimensions of a referenced element.
 * Useful for responsive components that need to adapt to their container size.
 *
 * @param options - Configuration options
 * @returns Tuple of [ref, size] - ref to attach to element, current size
 *
 * @example
 * ```tsx
 * function ResponsiveContainer() {
 *   const [ref, { width, height }] = useResizeObserver<HTMLDivElement>();
 *
 *   return (
 *     <div ref={ref} className="container">
 *       <p>Width: {width}px, Height: {height}px</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useResizeObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseResizeObserverOptions = {}
): [RefObject<T | null>, ElementSize] {
  const { initialWidth = 0, initialHeight = 0, debug = false } = options;
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ElementSize>({
    width: initialWidth,
    height: initialHeight,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    // Check for ResizeObserver support
    if (typeof ResizeObserver === "undefined") {
      console.warn(
        "[useResizeObserver] ResizeObserver is not supported in this environment"
      );
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });

        if (debug) {
          console.log(
            `[useResizeObserver] Size changed: ${width}x${height}`
          );
        }
      }
    });

    resizeObserver.observe(element);

    // Set initial size
    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => {
      resizeObserver.disconnect();
    };
  }, [debug]);

  return [ref, size];
}

/**
 * Hook to observe element width only
 *
 * @param options - Configuration options
 * @returns Tuple of [ref, width] - ref to attach to element, current width
 *
 * @example
 * ```tsx
 * function WidthAwareComponent() {
 *   const [ref, width] = useElementWidth<HTMLDivElement>();
 *
 *   return (
 *     <div ref={ref}>
 *       {width > 500 ? <WideLayout /> : <NarrowLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useElementWidth<T extends HTMLElement = HTMLDivElement>(
  options: Omit<UseResizeObserverOptions, "initialHeight"> = {}
): [RefObject<T | null>, number] {
  const [ref, size] = useResizeObserver<T>(options);
  return [ref, size.width];
}

/**
 * Hook to observe element height only
 *
 * @param options - Configuration options
 * @returns Tuple of [ref, height] - ref to attach to element, current height
 *
 * @example
 * ```tsx
 * function HeightAwareComponent() {
 *   const [ref, height] = useElementHeight<HTMLDivElement>();
 *
 *   return (
 *     <div ref={ref} style={{ height: `${height}px` }}>
 *       Content adapts to height
 *     </div>
 *   );
 * }
 * ```
 */
export function useElementHeight<T extends HTMLElement = HTMLDivElement>(
  options: Omit<UseResizeObserverOptions, "initialWidth"> = {}
): [RefObject<T | null>, number] {
  const [ref, size] = useResizeObserver<T>(options);
  return [ref, size.height];
}

/**
 * Hook to check if element width exceeds a threshold
 *
 * @param threshold - Width threshold in pixels
 * @returns Tuple of [ref, isWideEnough] - ref to attach, boolean if width >= threshold
 *
 * @example
 * ```tsx
 * function CollapsiblePanel() {
 *   const [ref, canShowSidebar] = useElementWidthAtLeast(300);
 *
 *   return (
 *     <div ref={ref} className="panel">
 *       {canShowSidebar && <Sidebar />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useElementWidthAtLeast<T extends HTMLElement = HTMLDivElement>(
  threshold: number
): [RefObject<T | null>, boolean] {
  const [ref, width] = useElementWidth<T>();
  return [ref, width >= threshold];
}
