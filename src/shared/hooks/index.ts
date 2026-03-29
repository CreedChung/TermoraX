/**
 * Responsive hooks collection
 *
 * Provides utilities for handling responsive layouts and viewport changes
 * in the TermoraX desktop application.
 */

// Window size tracking
export {
  useWindowSize,
  useIsCompact,
  useIsWide,
} from "./useWindowSize";
export type { WindowSize } from "./useWindowSize";

// Media query utilities
export {
  useMediaQuery,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  useCanHover,
  useIsTouchDevice,
} from "./useMediaQuery";

// Tailwind breakpoint integration
export {
  BREAKPOINTS,
  useBreakpoint,
  useBreakpointDown,
  useBreakpointBetween,
  useActiveBreakpoint,
  useBreakpoints,
} from "./useBreakpoint";
export type { BreakpointName } from "./useBreakpoint";

// Element resize observation
export {
  useResizeObserver,
  useElementWidth,
  useElementHeight,
  useElementWidthAtLeast,
} from "./useResizeObserver";
export type { ElementSize, UseResizeObserverOptions } from "./useResizeObserver";
